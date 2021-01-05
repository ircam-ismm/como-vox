# !/usr/bin/env python3
# -*- coding: utf-8 -*-

import glob
import json
import os

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import signal

#from scipy.signal import savgol_filter
#from scipy.stats import linregressfrom 
# import seaborn as sns

# %matplotlib


""" functions for sensors values
"""

def accel_intensity(accelerometers_data, axis_weights,integration_parameter, 
                    rolling_window, compression, scaling):
    """ return 1D intensity after derivating and integration
    """
    
    acc_x_derivate = np.gradient(accelerometers_data['acc.x'])
    acc_y_derivate = np.gradient(accelerometers_data['acc.y'])
    acc_z_derivate = np.gradient(accelerometers_data['acc.z'])
    
    acc_x_int = signal.lfilter([1],[1, integration_parameter],
                               np.maximum(acc_x_derivate, 0)) #other option, take the square
    acc_y_int = signal.lfilter([1],[1, integration_parameter],
                               np.maximum(acc_y_derivate, 0))
    acc_z_int = signal.lfilter([1],[1, integration_parameter],
                               np.maximum(acc_z_derivate, 0))
    
    intensity = scaling * pd.Series(((axis_weights[0]*(acc_x_int**2)
                                    + axis_weights[1]*(acc_y_int**2)
                                    + axis_weights[2]*(acc_z_int**2))
                                    /(3*sum(axis_weights)))
                                    **(0.5/compression))\
                                    .rolling(window = rolling_window,
                                             min_periods = 1).mean()
 
    return intensity

def rotation_intensity(gyroscope_data, axis_weights, 
                    rolling_window, scaling):
    """ return 1D intensity 
    """
    
    vx = gyroscope_data['rot.alpha']
    vy = gyroscope_data['rot.beta']
    vz = gyroscope_data['rot.gamma']
    intensity_1 = scaling * pd.Series(((vx - vy)**2
                                     + (vx - vz)**2
                                     + (vy - vz)**2)**0.5)\
                                     .rolling(window = rolling_window,
                                              min_periods = 1).mean()
    
    intensity_2  = scaling * pd.Series((axis_weights[0]*(vx**2) 
                                      + axis_weights[1]*(vy**2) 
                                      + axis_weights[2]*(vz**2))**0.5)\
                                      .rolling(window = rolling_window,
                                               min_periods = 1).mean()  
    
    return {'rot.int1': intensity_1,'rot.int2': intensity_2}

def filter_beat(beat, norepeat_interval):
    """ remove detected beat within a time interval
         could be more efficient
    """
    beat_filtered = np.copy(beat)
    size = beat_filtered.size
    for idx in range(size):
        interval = min(size - 1 - idx,norepeat_interval)
        if beat_filtered[idx] > 0:
            beat_filtered[idx+1:idx+1+interval] = (0 * 
                                        beat_filtered[idx+1:idx+1+interval])
        else:
            beat_filtered[idx] = 0
    return beat_filtered

def find_next_peak(dataframe_x, beat):
    """ find next peak after beat point
         could be more efficient
    """
   
    size = beat.size
    peak = np.zeros(size)
    peakSearch = 0
    temp = 0
    for idx in range(size-1):
        if (beat[idx] > 0):
            temp = dataframe_x[idx]
            peakSearch = 1
        elif peakSearch == 1:
            if (dataframe_x[idx+1] >= temp):
                temp = dataframe_x[idx+1]
            else: 
                peak[idx-1] = 1
                peakSearch = 0
    return peak


def kick(dataframe_x, threshold, median_window, norepeat_interval, detect):
    """ return 1 when kick is detected
    """
    
    df_diff = (dataframe_x -
               (dataframe_x.rolling(window=median_window, 
                                    min_periods = 1).median()) 
    #        .rolling(window = 5, min_periods =1).mean()  #adddtional filtering
               - threshold)

    if detect == 1:
        df_beat = filter_beat(df_diff.apply(np.sign).diff(), 
                              norepeat_interval)
    if detect == -1:  
        df_beat = filter_beat((-1*df_diff).apply(np.sign).diff(), 
                              norepeat_interval)
    
    df_peak = find_next_peak(dataframe_x, df_beat)

    return {'beat': df_beat, 'peak': df_peak, 'diff': df_diff}


def acceleration_analysis(sensors,axis_weights,integration_parameter, 
                    rolling_window, compression, scaling, threshold,
                    median_window, norepeat_interval, detect):
    """ adding intensity and kick/beat"""
    acceleration = sensors['acceleration']
    acceleration['int.recomputed'] = accel_intensity(acceleration,
                                                  axis_weights,
                                                 integration_parameter, 
                                                 rolling_window, 
                                                 compression, scaling)

    acceleration_temp = kick(acceleration['int.recomputed'], threshold,
                                     median_window, norepeat_interval, detect)
    acceleration['acc.beat'] = acceleration_temp['beat']
    acceleration['acc.peak'] = acceleration_temp['peak']
    acceleration['acc.diff'] = acceleration_temp['diff']
    
    
    return acceleration



def rotation_analysis(sensors,axis_weights,rolling_window, scaling):
    """ adding intensity """
    rotation = sensors['rotation']
    rotation_temp = rotation_intensity(rotation,axis_weights,
                                                rolling_window,
                                                scaling)

    rotation['rot.int1'] = rotation_temp['rot.int1']
    rotation['rot.int2'] = rotation_temp['rot.int2']

    return rotation


def sensors_read(filename):
    """Read filename that contains sensors values, with line as JSON.

    Args:
        filename

    Returns:
        {'index', 'time', 'acceleration', 'rotation'}

        with:
        - time in seconds
        - acceleration as pandas
        - rotation as pandas
    """
    data = []
    with open(filename) as f:
        for line in f:
            data.append(json.loads(line))

    data_frame = pd.json_normalize(data)

    data_frame.rename(columns={'metas.id': 'id',
                               'metas.time': 'time',
                               'metas.period': 'period',
                               'accelerationIncludingGravity.x': 'acc.x',
                               'accelerationIncludingGravity.y': 'acc.y',
                               'accelerationIncludingGravity.z': 'acc.z',
                               'rotationRate.alpha': 'rot.alpha',
                               'rotationRate.beta': 'rot.beta',
                               'rotationRate.gamma': 'rot.gamma',
                               'accelerationBandpass5hz.x' : 'accelerationBandpass5hz.x',
                               'accelerationBandpass5hz.y' : 'accelerationBandpass5hz.y',
                               'accelerationBandpass5hz.z' : 'accelerationBandpass5hz.z',
                               'orientation.x' : 'orientation.x',
                               'orientation.y' : 'orientation.y',
                               'orientation.z' : 'orientation.z',
                               'rotationRateMs.alpha': 'rotMs.alpha',
                               'rotationRateMs.beta': 'rotMs.beta',
                               'rotationRateMs.gamma': 'rotMs.gamma',
                               'intensity.linear': 'int.lin',
                               'intensity.compressed': 'int.comp',
                               'timeSignature.count' : 'timeSignature.count',
                               'timeSignature.division' :'timeSignature.division',
                               'playback' : 'playback',
                               'time' : 'time2',
                               'position.bar' : 'position.bar',
                               'position.beat' : 'position.beat', 
                               'notes' : 'notes',
                               'beat.time' : 'beat.time',
                               'beat.trigger' : 'beat.trigger', 
                               'beat.type' : 'beat.type',
                               'beat.intensity' : 'beat.intensity',
                               'beatdelta' : 'beatdelta',
                               'beat.median' : 'beat.median',
                               'ml-decoder.likeliest' : 'ml-decoder.likeliest',
                               'ml-decoder.likeliestIndex' : 'ml-decoder.likeliestIndex',
                               'ml-decoder.likelihoods' : 'ml-decoder.likelihoods',
                               'ml-decoder.timeProgressions' : 'ml-decoder.timeProgressions',
                               'ml-decoder.alphas' : 'ml-decoder.alphas',
                               'ml-decoder.outputValues' : 'ml-decoder.outputValues',
                               'ml-decoder.outputCovariance' : 'ml-decoder.outputCovariance',
                               'tempo': 'tempo'},
                      inplace=True)

    index = data_frame.loc[0, 'id']
    time = data_frame.loc[:, 'time']

    acceleration = data_frame.loc[:, ['acc.x', 'acc.y', 'acc.z']] 
    rotation = data_frame.loc[:, ['rot.alpha', 'rot.beta', 'rot.gamma']]
    intensity = data_frame.loc[:, ['int.lin', 'int.comp']]
    beat = data_frame.loc[:, ['beat.time', 'beat.trigger', \
                              'beat.intensity', 'beat.delta', 'beat.median']]
    
    position = data_frame.loc[:, ['position.bar', 'position.beat']]
    position['position.beat'] = position['position.beat'].apply(np.floor)  
    
    metronome = position.diff()
    metronome['position.beat'] = metronome['position.beat'].apply(np.abs) 
    
    notes = data_frame.loc[:,['notes']]
    
    return {'index': index, 
            'time': time,
            'acceleration': acceleration,
            'rotation': rotation,
            'intensity': intensity,
            'beat': beat,
            'position' : position,
            'metronome' : metronome,
            'notes' : notes
            }


def multiple_sensors_read(filename_pattern):
    """Read given filenames matching pattern.

    Args:
        filename_pattern, shell-like

    Example:
        data = multiple_sensors_read('./data/20201014-17*')

    Returns:
        dict of sensors values, with filename as index
    """
    filenames = glob.iglob(filename_pattern, recursive=True)
    data = {}

    for filename in filenames:
        index = os.path.basename(filename)
        data[index] = sensors_read(filename)

    return data



def sensors_plot(sensors, title, y_limits, figure_number = 1):
    """Plot sensor values.

    Args:
        sensors as dict of {'index', 'time', 'acceleration', 'rotation'}
        figures as None or existing figure to add plots to it

    Returns:
        dict of figures {'acceleration', 'rotation'}
    """
 
#setting data
    time = sensors['time']
    acceleration = sensors['acceleration']
    rotation = sensors['rotation']
    intensity = sensors['intensity']
    beat = sensors['beat']
    position = sensors['position']
    metronome = sensors['metronome']    
#    index = sensors['index']
    
# setting time for beats and bars    
    metronome_beat = time[metronome.loc[metronome['position.beat'] != 0].index]
    metronome_bar = time[metronome.loc[metronome['position.bar'] == 1].index]
    sensors_beat = time[beat.loc[beat['beat.trigger'] == 1].index]
    acceleration_beat = time[acceleration.loc[acceleration['acc.beat'] 
                                                                   > 0].index]
     

# set figure and subplots       
    acceleration_columns_number = acceleration.shape[1]
    rotation_columns_number = rotation.shape[1]
    intensity_columns_number = intensity.shape[1]
    total_columns_number = acceleration_columns_number + \
                        rotation_columns_number + \
                        intensity_columns_number
                 
    all_figure = plt.figure(figure_number, figsize = (20,20))
    plt.style.use('seaborn-whitegrid')
    plt.figtext(0.15,0.91, '', fontsize = 14)
    all_figure_axes = all_figure.subplots(total_columns_number, 
                                          sharex=True, sharey=False)
    
    for i in range(0, total_columns_number):
        all_figure_axes[i] = plt.subplot(total_columns_number, 1, i+1 ,\
                                          sharex=all_figure_axes[0])

        #title = 'Acceleration - Rotation - Intensity '
        window_title = '{0} (Figure {1})' .format(title, all_figure.number)
        all_figure.canvas.set_window_title(window_title)
        all_figure.suptitle(title)


# acceleration plots
    for i in enumerate(acceleration): 
        label = ('acceleration' if i[0] == 0 else None)
        j = i[0]               
        all_figure_axes[j].\
            plot(time, acceleration.iloc[:,i[0]],'tab:red',label=label)
        all_figure_axes[j].set_ylabel(i[1],rotation=0,ha ='right')
       
        if y_limits != 0:
            all_figure_axes[j].set_ylim(y_limits['acceleration'])
            y_min = y_limits['acceleration'][0]
            y_max = y_limits['acceleration'][1]
        else:
            y_min = all_figure_axes[j].get_ylim()[0]
            y_max = all_figure_axes[j].get_ylim()[1]
       
        all_figure_axes[j].vlines(metronome_beat, y_min, y_max, 'tab:grey') 
        all_figure_axes[j].vlines(metronome_bar, y_min, y_max, 'black') 
        #all_figure_axes[j].vlines(sensors_beat, y_min, y_max, 'tab:blue') 
        all_figure_axes[j].vlines(acceleration_beat, y_min, y_max, 'tab:cyan') 
        all_figure_axes[j].label_outer()


# rotation plots
    for i in enumerate(rotation):  
        label = ('rotation' if i == 0 else None)
        j = i[0] + acceleration_columns_number
        all_figure_axes[j].\
            plot(time, rotation.iloc[:, i[0]],'tab:orange',label=label)
        all_figure_axes[j].set_ylabel(i[1],rotation=0,ha ='right')
      
        if y_limits != 0:
            all_figure_axes[j].set_ylim(y_limits['rotation'])
            y_min = y_limits['rotation'][0]
            y_max = y_limits['rotation'][1]
        else:
            y_min = all_figure_axes[j].get_ylim()[0]
            y_max = all_figure_axes[j].get_ylim()[1]
       
        all_figure_axes[j].vlines(metronome_beat, y_min, y_max, 'tab:grey') 
        all_figure_axes[j].vlines(metronome_bar, y_min, y_max, 'black') 
        #all_figure_axes[j].vlines(sensors_beat, y_min, y_max, 'tab:blue') 
        all_figure_axes[j].vlines(acceleration_beat, y_min, y_max, 'tab:cyan') 
        all_figure_axes[j].label_outer()

# intensity plots       
    for i in enumerate(intensity): 
        label = ('intensity' if i == 0 else None)
        j = i[0] + acceleration_columns_number + rotation_columns_number
        all_figure_axes[j].\
            plot(time, intensity.iloc[:, i[0]],'tab:purple',label=label)
        all_figure_axes[j].set_ylabel(i[1],rotation=0,ha ='right')
       
        if (i[0] == 0): 
            if y_limits != 0:
                all_figure_axes[j].set_ylim(y_limits['intensity_lin'])
                y_min = y_limits['intensity_lin'][0]
                y_max = y_limits['intensity_lin'][1]
            else:
                y_min = all_figure_axes[j].get_ylim()[0]
                y_max = all_figure_axes[j].get_ylim()[1]
       
        all_figure_axes[j].vlines(metronome_beat, y_min, y_max, 'tab:grey') 
        all_figure_axes[j].vlines(metronome_bar, y_min, y_max, 'black') 
        #all_figure_axes[j].vlines(sensors_beat, y_min, y_max, 'tab:blue') 
        all_figure_axes[j].vlines(acceleration_beat, y_min, y_max, 'tab:cyan') 
                      
        if (i[0] == 1): 
            if y_limits != 0:
                all_figure_axes[j].set_ylim(y_limits['intensity_comp'])
                y_min = y_limits['intensity_comp'][0]
                y_max = y_limits['intensity_comp'][1]
            else:
                y_min = all_figure_axes[j].get_ylim()[0]
                y_max = all_figure_axes[j].get_ylim()[1]
            
        all_figure_axes[j].vlines(metronome_beat, y_min, y_max, 'tab:grey') 
        all_figure_axes[j].vlines(metronome_bar, y_min, y_max, 'black') 
        #all_figure_axes[j].vlines(sensors_beat, y_min, y_max, 'tab:blue') 
        all_figure_axes[j].vlines(acceleration_beat, y_min, y_max, 'tab:cyan') 
        
        all_figure_axes[j].label_outer()
    
  
# final setting

    #all_figure.subplots_adjust(hspace=0)
    all_figure.legend()
    all_figure.show()



def multiple_sensors_plot(mutiple_sensors, figures=None):
    """Plot multiple sensor values.

    Args:
        multiple_sensors as dict of sensors
        sensors as a dict of {'index', 'time', 'acceleration', 'rotation', 'intensity'}
        figures as None or existing figure to add plots to it

    Returns:
        dict of figures {'acceleration', 'rotation'}
    """
    for sensors in mutiple_sensors.values():
        figures = sensors_plot(sensors, figures)

    return figures

# if __name__ == '__main__':
#  print('como_data_read_plot executed')
# else:
#  print('como_data_read_plot imported')