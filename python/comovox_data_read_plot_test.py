# !/usr/bin/env python3
# -*- coding: utf-8 -*-

import glob
import json
import os

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import signal
from scipy import stats

#from scipy.signal import savgol_filter
#from scipy.stats import linregressfrom 
# import seaborn as sns

# %matplotlib


""" functions for sensors values
"""

def delta(x, y, order):
    size = np.size(x)
    dy = np.zeros(size)
    if order > 1: 
        for i in range(size - order):
            dy[i+order] = stats.linregress(x[i:i+order],
                                                    y[i:i+order])[0]
    else:
        print('error in delta computation: delta_order must be >1')
    
    return dy


def accel_intensity(accelerometers_data, orientation, time, axis_weights,
                    integration_parameter, acceleration_average_order, compression, 
                    scaling, delta_order):
    
    """ return 1D intensity after derivating and integration
    """
    
        
    # acc_x_derivate = np.gradient(accelerometers_data['acc.x'])
    # acc_y_derivate = np.gradient(accelerometers_data['acc.y'])
    # acc_z_derivate = np.gradient(accelerometers_data['acc.z'])
    
    # g = -9.81
    g = 0
    
    acc_x = accelerometers_data['acc.x'] - (orientation['orientation.x'] * g)
    acc_y = accelerometers_data['acc.y'] - (orientation['orientation.y'] * g)
    acc_z = accelerometers_data['acc.z'] - (orientation['orientation.z'] * g)
    
    acc_x_filterd = acc_x.rolling(
        window = acceleration_average_order, min_periods = 1).mean()
    acc_y_filterd = acc_y.rolling(
        window = acceleration_average_order, min_periods = 1).mean()
    acc_z_filterd = acc_z.rolling(
        window = acceleration_average_order, min_periods = 1).mean()
    
    acc_x_derivate = delta(time, acc_x_filterd, delta_order)
    acc_y_derivate = delta(time, acc_y_filterd, delta_order)
    acc_z_derivate = delta(time, acc_z_filterd, delta_order)
    
    # acc_x_derivate = delta(time, accelerometers_data['acc.x'], delta_order)
    # acc_y_derivate = delta(time, accelerometers_data['acc.y'], delta_order)
    # acc_z_derivate = delta(time, accelerometers_data['acc.z'], delta_order)
    
    acc_x_int = signal.lfilter([1],[1, integration_parameter],
                                np.maximum(acc_x_derivate, 0)) #other option, take the square
    acc_y_int = signal.lfilter([1],[1, integration_parameter],
                                np.maximum(acc_y_derivate, 0))
    acc_z_int = signal.lfilter([1],[1, integration_parameter],
                                np.maximum(acc_z_derivate, 0))
    
    # acc_x_int = signal.lfilter([1],[1, integration_parameter],
    #                             np.abs(acc_x_derivate)) #other option, take the square
    # acc_y_int = signal.lfilter([1],[1, integration_parameter],
    #                             np.abs(acc_y_derivate))
    # acc_z_int = signal.lfilter([1],[1, integration_parameter],
    #                             np.abs(acc_z_derivate))
    
    
    
    
    intensity = scaling * pd.Series(((axis_weights[0]*(acc_x_int**2)
                                    + axis_weights[1]*(acc_y_int**2)
                                    + axis_weights[2]*(acc_z_int**2))
                                    /sum(axis_weights))
                                    **(0.5/compression))
    

    # testing with max values between max
    #size = np.size(acc_x_derivate)
    # int = np.zeros(size)
    
    # for i in range(size):
    #     int[i] = max(acc_x_int[i], acc_y_int[i], acc_z_int[i])
    
    # intensity = scaling * pd.Series(int).rolling(window = acceleration_average_order,
    #                                            min_periods = 1).mean()
    
    #norm acceleration
    # norm = pd.Series(((axis_weights[0]*(acc_x_int**2)
    #         + axis_weights[1]*(acc_y_int**2)
    #         + axis_weights[2]*(acc_z_int**2))
    #         /sum(axis_weights))**(0.5/compression))\
    #         .rolling(window = acceleration_average_order, min_periods = 1).mean()
    
    return intensity

def rotation_intensity(gyroscope_data, axis_weights, 
                    rotation_average_order, scaling):
    """ return 1D intensity 
    """
    
    vx = gyroscope_data['rot.alpha']
    vy = gyroscope_data['rot.beta']
    vz = gyroscope_data['rot.gamma']
    intensity_1 = scaling * pd.Series(((vx - vy)**2
                                     + (vx - vz)**2
                                     + (vy - vz)**2)**0.5)\
                                     .rolling(window = rotation_average_order,
                                              min_periods = 1).mean()
    
    intensity_2  = scaling * pd.Series((axis_weights[0]*(vx**2) 
                                      + axis_weights[1]*(vy**2) 
                                      + axis_weights[2]*(vz**2))**0.5)\
                                      .rolling(window = rotation_average_order,
                                               min_periods = 1).mean()  
    
    return {'rot.int1': intensity_1,'rot.int2': intensity_2}

def filter_beat(beat, inhibition_duration):
    """ remove detect_uped beat within a time interval
         could be more efficient
    """
    beat_filtered = np.copy(beat)
    size = beat_filtered.size
    for idx in range(size):
        interval = min(size - 1 - idx,inhibition_duration)
        if beat_filtered[idx] > 0:
            beat_filtered[idx+1:idx+1+interval] = (0 * 
                                        beat_filtered[idx+1:idx+1+interval])
        else:
            beat_filtered[idx] = 0
    return beat_filtered

def find_next_peak(dataframe_x, beat, peak_search_window, detect_up):
    """ find next peak after beat point
         could be more efficient
    """
    peak_search_window = 20
    size = beat.size
    peak = np.zeros(size)
    onset = 0
    temp = 0
    for idx in range(size-1):
        if (beat[idx] > 0):
            temp = dataframe_x[idx]
            onset = 1
        elif onset == 1:
            idx_max = idx
            for i in range(peak_search_window - 2):
                if (idx+i+1 < np.size(dataframe_x) and 
                dataframe_x[idx+i+1]*detect_up) >= temp*detect_up:
                    temp = dataframe_x[idx+i+1]
                    idx_max = idx+i+1
            peak[idx_max] = 1    
            onset = 0

    return peak




def kick(dataframe_x, threshold, onset_order, inhibition_duration, detect_up):
    """ return 1 when kick is detect_uped
    """
    
    df_diff = (dataframe_x -
               (dataframe_x.rolling(window=onset_order, 
                                    min_periods = 1).median()) 
            .rolling(window = 3, min_periods =1).mean())  #adddtional filtering
 #              - detect_up*threshold)

    
    df_diff_thres = detect_up*(df_diff - detect_up*threshold)
    
    df_beat = filter_beat(df_diff_thres.apply(np.sign).diff(), 
                              inhibition_duration)

    df_peak = find_next_peak(dataframe_x, df_beat, detect_up)

    return {'beat': df_beat, 'peak': df_peak, 'diff': df_diff_thres}

def peak(dataframe_x, threshold, threshold_min, onset_order, 
         inhibition_duration, peak_search_window, detect_up):
    """ return 1 when kick is detect_uped
    
        threshold is proportionnal to the standard deviation
        as  in Brakel, J.P.G. van (2014).
        "Robust peak detect_upion algorithm using z-scores". 
        Stack Overflow. 
        https://stackoverflow.com/questions/22583391/\
        peak-signal-detect_upion-in-realtime-timeseries-data/22640362#22640362 
        (version: 2020-11-08).
        
        (using influence = 1)
    """
    
    # df_diff = (dataframe_x
    #     - dataframe_x.rolling(window=onset_order, min_periods = 1).mean() 
    #     - detect_up*threshold*(dataframe_x.rolling(window=onset_order,min_periods = 1).std())
    #     - threshold_min) 
    
    # algo to match code in real time
    size = np.size(dataframe_x)
    df_diff = np.zeros(size)
    for i in range(size - onset_order):      
        df_diff[i+onset_order] = (dataframe_x[i+onset_order] 
        - np.mean(dataframe_x[i:i+onset_order])
        - detect_up*threshold*np.std(dataframe_x[i:i+onset_order],ddof = 1)
        - threshold_min)
     
    
    df_peak = filter_beat(pd.Series(df_diff).apply(np.sign).diff(), 
                           inhibition_duration)
    
    df_peak = find_next_peak(dataframe_x, df_peak, peak_search_window, 1)

    return {'peak': df_peak, 'diff': df_diff}

class PeakSearch:
    def __init__(self, *, startTime, searchDuration):
        self.startTime = startTime
        self.peakFound = False
        self.searchDuration = searchDuration
        self.searchCompleted = False
        self.peakIntensity = 0
        self.peakTime = startTime


    def process(self, *, time, intensity):
        if (time - self.startTime < self.searchDuration):
            if (intensity > self.peakIntensity):
               self.peakIntensity = intensity
               self.peakTime = time
        else:
            self.searchCompleted = True
            # avoid bad peak when still increasing at the end of the search window
            if (intensity < self.peakIntensity):
                self.peakFound = True

        return self

peakSearches = set();

def peak_as_script(df_acc_int, df_acc_raw, df_diff, df_rotation, tempo, rotation_threshold,
                      inhibition_duration, peak_search_window, 
                      inhibitionLimits, peakSearchLimits, playback, peak_threshold):
    """ 
    code matches algorithm in beatTriggerFromGesturePeakAdapt.js
    """
    
    # algo to match code in real time
    size = np.size(df_diff)
    df_peak_script = np.zeros(size)
    df_onset_script = np.zeros(size)
    df_intensity_script = np.zeros(size)
    tempo_estimated = np.ones(size) * 100

    
    # intialization
    positiveDelta = 0
    lastBeatTime = 0
    lastDelta = -1
    timeOnset = 0
    timeMax = 0
    tempMax = 0
    inhibitionDuration = inhibition_duration
    rotationThreshold = rotation_threshold['safe']
    peakThreshold = peak_threshold['safe']
    peakSearchDuration = peak_search_window
    previous_timeMax = 0
    previous_delta = 30
    interval_filtered = 30

    
    for i in range(size - inhibition_duration - 1):   
           
        time = i+1
        delta = df_diff[time]
        lastDelta =df_diff[time - 1]  
        intensityNormalized = df_acc_int[time]
        acceleration_raw = df_acc_raw[time]
        intensityRotation = df_rotation[time]

        if (playback[time]):
            rotationThreshold = rotation_threshold['sensitive']
            peakThreshold = peak_threshold['sensitive']
        else:
            rotationThreshold = rotation_threshold['safe']
            peakThreshold = peak_threshold['safe']

        
        #adaptation
        # inhibitionDuration = max(inhibitionLimits['min'],
        #                       min(inhibitionLimits['max'],
        #                           inhibitionLimits['beats']*60/tempo_estimated[time]))
        # peakSearchDuration = max(peakSearchLimits['min'],
        #                       min(peakSearchLimits['max'],
        #                           peakSearchLimits['beats']*60/tempo_estimated[time]))
        
        inhibitionDuration = max(inhibitionLimits['min'],
                              min(inhibitionLimits['max'],
                                  inhibitionLimits['beats']*60/tempo[time]))
        peakSearchDuration = max(peakSearchLimits['min'],
                              min(peakSearchLimits['max'],
                                  peakSearchLimits['beats']*60/tempo[time]))
        
        
        tempo_estimated[time] = tempo_estimated[time - 1]
        
        onset = (intensityRotation > rotationThreshold) and (delta > 0) and (lastDelta < 0)
        
        #### with several process
        
        
        # if (onset and time - lastBeatTime > inhibitionDuration):
        if (onset):
            peakSearches.add(PeakSearch(startTime=time, searchDuration=peakSearchDuration))
            df_onset_script[time] = 1

        # copy to remove completed searches
        peakSearchesLoop = set(peakSearches)
        for search in peakSearchesLoop:
            result = search.process(time=time, intensity=intensityNormalized)

            if (result.searchCompleted):
                peakSearches.remove(search)
                # filter peaks
                if (result.peakFound
                    and result.peakTime - lastBeatTime > inhibitionDuration
                    and result.peakIntensity > peakThreshold):
                    # df_onset_script[result.startTime] = 1
                    df_peak_script[time] = 1
                    df_intensity_script[result.peakTime] = result.peakIntensity

                    previous_timeMax = timeMax
                    timeMax = result.peakTime
                    delta_time = timeMax - previous_timeMax
                    delta_time_clipped = max(20, min(75,delta_time))
                    interval_filtered = (delta_time_clipped*(1 - 0.7) 
                                              + previous_delta*0.7)
                    
                    previous_delta =  interval_filtered
                    interval_filtered = delta_time_clipped
                    # interval_filtered = delta_time_clipped
                    if interval_filtered > 0:
                        tempo_estimated[time] = 60/(0.02 * interval_filtered)

                    lastBeatTime = result.peakTime
              
    
    # peakSearches.clear()        
        
        # #### old version without process 
        # if (time - lastBeatTime > inhibitionDuration):
        #     if (positiveDelta == 0):
        #         # onset detect_upion
        #         if (onset):
        #             positiveDelta = 1;
        #             timeOnset = time;
        #             df_onset_script[time] = 1;
        #             tempMax = 0;
        #             timeMax = time;   
        #     else:
        #             # peak detect_upion
        #         if (time - timeOnset < peakSearchDuration):
        #             if (intensityNormalized > tempMax):
        #                 tempMax = intensityNormalized;
                    
        #             # if (acceleration_raw > tempMax):
        #             #     tempMax = acceleration_raw;
                        
        #                 timeMax = time;
                                            
        #         else:
        #             df_peak_script[time] = 1;
        #             df_intensity_script[timeMax] = tempMax;
        #             delta_time = timeMax - previous_timeMax
        #             previous_timeMax = timeMax
        #             delta_time_clipped = max(20, min(75,delta_time))
        #             interval_filtered = (delta_time_clipped*(1 - 0.7) 
        #                                       + previous_delta*0.7)
                    
        #             previous_delta =  interval_filtered
        #             interval_filtered = delta_time_clipped
        #             # interval_filtered = delta_time_clipped
        #             if interval_filtered > 0:
        #                 tempo_estimated[time] = 60/(0.02 * interval_filtered)
        #             positiveDelta = 0;
        #             lastBeatTime = timeMax;
        #             tempMax = 0;
        #             timeMax = 0;
                
    
    return {'peak_script': df_peak_script, 'onset_script': df_onset_script, 
            'intensity_script': df_intensity_script,
            'tempo_estimated': tempo_estimated, 'delta_script': df_diff}


def rotation_analysis(sensors,axis_weights,rotation_average_order, scaling):
    """ adding intensity """
    rotation = sensors['rotation']
    rotation_temp = rotation_intensity(rotation,axis_weights,
                                                rotation_average_order,
                                                scaling)

    rotation['rot.int1'] = rotation_temp['rot.int1']
    rotation['rot.int2'] = rotation_temp['rot.int2']

    return rotation


def acceleration_analysis(sensors,axis_weights,integration_parameter, 
                    acceleration_average_order, compression, scaling, delta_order,
                    threshold, threshold_min, onset_order, inhibition_duration, 
                    peak_search_window, 
                    inhibitionLimits, peakSearchLimits,
                    rotation_threshold, peak_threshold,  detect_up):
    """ adding intensity and kick/beat"""
    
    
    acceleration = sensors['acceleration']
    rotation = sensors['rotation']
    orientation = sensors['orientation']
    time = sensors['time']
    tempo = sensors['tempo']
    playback = sensors['playback']['playback']
    
    
    acceleration['int.recomputed'] = accel_intensity(
                                                acceleration, orientation, time,
                                                axis_weights,
                                                integration_parameter, 
                                                acceleration_average_order, 
                                                compression, scaling, 
                                                delta_order)
    

    # acceleration_temp = kick(acceleration['int.recomputed'], threshold,
    #                                  onset_order, inhibition_duration, detect_up)
    acceleration_temp = peak(acceleration['int.recomputed'], threshold,
                             threshold_min, onset_order, inhibition_duration, 
                             peak_search_window, detect_up)
    
    acceleration_script = peak_as_script(sensors['beat']['beat.intensityNormalized'],
                                         sensors['beat']['beat.acceleration'],
                            sensors['beat']['beat.delta'],
                            rotation['rot.int2'],
                            tempo,
                            rotation_threshold,
                            inhibition_duration, 
                            peak_search_window,
                            inhibitionLimits, peakSearchLimits, 
                            playback, peak_threshold)
    
    # acceleration_script = peak_as_script(acceleration['int.recomputed'],
    #                                      sensors['beat']['beat.acceleration'],
    #                         acceleration_temp['diff'],
    #                         rotation['rot.int2'],
    #                         tempo,
    #                         rotation_threshold,
    #                         inhibition_duration, 
    #                         peak_search_window,
    #                         inhibitionLimits, peakSearchLimits)
    
    
    
    #acceleration['acc.beat'] = acceleration_temp['beat']
    acceleration['acc.peak'] = acceleration_temp['peak']
    acceleration['acc.diff'] = acceleration_temp['diff']
    acceleration['onset.script'] = acceleration_script['onset_script']
    acceleration['peak.script'] = acceleration_script['peak_script']
    acceleration['intensity.script'] = acceleration_script['intensity_script']
    acceleration['tempo_estimated'] = acceleration_script['tempo_estimated']
    acceleration['delta.script'] = acceleration_script['delta_script']
 
    
    return acceleration



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
                               'beat.intensityNormalized' : 'beat.intensityNormalized',
                               'beat.intensityRotation' : 'beat.intensityRotation',
                               'beat.delta' : 'beat.delta',
                               'beat.mean' : 'beat.mean',
                               'beat.std' : 'beat.std',
                               'beat.delta' : 'beat.delta',
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
    
    tempo = data_frame.loc[:, 'tempo']
    orientation = data_frame.loc[:,['orientation.x', 'orientation.y', 'orientation.z']] 
    acceleration = data_frame.loc[:, ['acc.x', 'acc.y', 'acc.z']] 
    rotation = data_frame.loc[:, ['rot.alpha', 'rot.beta', 'rot.gamma']]
    intensity = data_frame.loc[:, ['int.lin', 'int.comp']]
    
    # ver 20 
    # beat = data_frame.loc[:, ['beat.time', 'beat.trigger', \
    #                           'beat.intensity', 'beat.delta']]#, 'beat.median']]
    # ver 21 test 
    # beat = data_frame.loc[:, ['beat.time', 
    #                           'beat.timeOnset',
    #                           'beat.timeMax',
    #                           'beat.timePlot',
    #                           'beat.trigger', 
    #                           'beat.acceleration', 
    #                           'beat.derivate',
    #                           'beat.intensity', 
    #                           'beat.intensityFiltered',
    #                           'beat.delta',
    #                           'beat.mean',
    #                           'beat.std']]
    
    # 21 - 2 
    beat = data_frame.loc[:, ['beat.time', 
                              'beat.timeOnset',
                              'beat.timeMax',
                              'beat.timePlot',
                              'beat.trigger', 
                              'beat.acceleration', 
                              'beat.derivate',
                              'beat.intensity', 
                              'beat.intensityNormalized',
                              'beat.intensityRotation',
                              'beat.delta',
                              'beat.mean',
                              'beat.std']]
    
    position = data_frame.loc[:, ['position.bar', 'position.beat']]
    position['position.beat'] = position['position.beat'].apply(np.floor)  
    
    metronome = position.diff()
    metronome['position.beat'] = metronome['position.beat'].apply(np.abs) 
    
    playback = data_frame.loc[:, ['playback']]
    
    #notes = data_frame.loc[:,['notes']]
    
    return {'index': index, 
            'time': time,
            'acceleration': acceleration,
            'rotation': rotation,
            'intensity': intensity,
            'beat': beat,
            'position' : position,
            'metronome' : metronome,
            'tempo' :tempo,
            'orientation' : orientation,
            'playback' : playback,
            #'notes' : notes
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



def sensors_plot(sensors, title, y_limits, 
                 beat_trigger = True, beat_offline = True, metronome = True,
                 figure_number = 1):
    """Plot sensor values.

    Args:
        sensors as dict of {'index', 'time', 'acceleration', 'rotation'}
        figures as None or existing figure to add plots to it

    Returns:
        dict of figures {'acceleration', 'rotation'}
    """
 
#setting data
    # time = sensors['time']
    time = sensors['beat']['beat.timePlot']
    acceleration = sensors['acceleration']
    
    # acceleration_x = pd.DataFrame(sensors['beat']['beat.acceleration'])
    acceleration['acc_x'] = sensors['beat']['beat.acceleration']
    acceleration['derivate'] =  sensors['beat']['beat.derivate']
    acceleration['intensity'] =  sensors['beat']['beat.intensity']
    acceleration['intFilt'] = sensors['beat']['beat.intensityNormalized']
    # acceleration['delta'] = sensors['beat']['beat.delta']
    acceleration['delta'] = sensors['acceleration']['delta.script']
    acceleration['timeMax'] = sensors['beat']['beat.timeMax']
    acceleration['mean'] = sensors['beat']['beat.mean']
    acceleration['std'] = sensors['beat']['beat.std'] 
    acceleration['intensityRotation'] = sensors['beat']['beat.intensityRotation']
    acceleration['peak.script'] = sensors['acceleration']['intensity.script'] 
    acceleration['onset.script'] = sensors['acceleration']['onset.script']
    
    acceleration['tempo_estimaated'] = sensors['acceleration']['tempo_estimated'] 
    acceleration['tempo'] = sensors['tempo']
    
    
    acceleration_selected = acceleration[['acc_x',
                                          'intFilt', 'int.recomputed',
                                          'delta','intensityRotation',
                                          'tempo','tempo_estimated']]

    
    
    rotation = pd.DataFrame(sensors['rotation']['rot.int2'])
    intensity = sensors['intensity']
    beat = sensors['beat']
    position = sensors['position']
    metronome = sensors['metronome']    
#    index = sensors['index']
    
# setting time for beats and bars    
    metronome_beat = time[metronome.loc[metronome['position.beat'] != 0].index]
    metronome_bar = time[metronome.loc[metronome['position.bar'] == 1].index]
    # sensors_beat = time[beat.loc[beat['beat.trigger'] == 1].index]
    sensors_beat = beat.loc[beat['beat.trigger'] ==  1]['beat.time']


    # acceleration_beat = time[acceleration.loc[acceleration['acc.beat'] 
    #                                                               > 0].index]
    # acceleration_peak = time[acceleration.loc[acceleration['acc.peak'] 
    #                                                                 > 0].index]
    acceleration_onset = time[acceleration.loc[acceleration['onset.script'] 
                                                                    > 0].index]
    acceleration_peak = time[acceleration.loc[acceleration['peak.script'] 
                                                                    > 0].index]
    


# set figure and subplots       
    acceleration_columns_number = acceleration_selected.shape[1]
    rotation_columns_number = rotation.shape[1]
    intensity_columns_number = 0 #intensity.shape[1]

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
    for i in enumerate(acceleration_selected): 
        label = ('acceleration' if i[0] == 0 else None)
        j = i[0]               
        all_figure_axes[j].\
            plot(time, acceleration_selected.iloc[:,i[0]],'tab:red', 
                 marker ='.',markersize = 3 , label=label)
        all_figure_axes[j].set_ylabel(i[1],rotation=0,ha ='right')
       
        if y_limits != 0:
            all_figure_axes[j].set_ylim(y_limits['acceleration'])
            y_min = y_limits['acceleration'][0]
            y_max = y_limits['acceleration'][1]
        else:
            y_min = all_figure_axes[j].get_ylim()[0]
            y_max = all_figure_axes[j].get_ylim()[1]
       
        # all_figure_axes[j].vlines(metronome_beat, y_min, y_max,
        #                           'tab:blue', zorder=3) 
        # all_figure_axes[j].vlines(metronome_bar, y_min, y_max, 
        #                           'black', zorder=3, linewidths = 2) 
        if beat_trigger == True:
            all_figure_axes[j].vlines(sensors_beat, y_min, y_max, 'tab:blue') 
        # if metronome  == True:
        #     all_figure_axes[j].vlines(acceleration_beat, y_min, y_max, 'tab:cyan')
        if beat_offline  == True:
            all_figure_axes[j].vlines(acceleration_peak, y_min, y_max, 
                                    'tab:orange', zorder=3)
            # all_figure_axes[j].vlines(acceleration_onset, y_min, y_max, 
            #                         'tab:green', zorder=3)
        all_figure_axes[j].label_outer()


#rotation plots
    # for i in enumerate(rotation):  
    #     label = ('rotation' if i == 0 else None)
    #     j = i[0] + acceleration_columns_number
    #     all_figure_axes[j].\
    #         plot(time, rotation.iloc[:, i[0]],'tab:orange',
    #               marker ='.',markersize = 3 ,label=label)
    #     all_figure_axes[j].set_ylabel(i[1],rotation=0,ha ='right')
      
    #     if y_limits != 0:
    #         all_figure_axes[j].set_ylim(y_limits['rotation'])
    #         y_min = y_limits['rotation'][0]
    #         y_max = y_limits['rotation'][1]
    #     else:
    #         y_min = all_figure_axes[j].get_ylim()[0]
    #         y_max = all_figure_axes[j].get_ylim()[1]
       
    #     # all_figure_axes[j].vlines(metronome_beat, y_min, y_max,
    #     #                           'tab:blue', zorder=3) 
    #     # all_figure_axes[j].vlines(metronome_bar, y_min, y_max, 
    #     #                           'black', zorder=3, linewidths = 2) 
    #     all_figure_axes[j].vlines(sensors_beat, y_min, y_max, 'tab:blue') 
    #     #all_figure_axes[j].vlines(acceleration_beat, y_min, y_max, 'tab:cyan')
    #     # all_figure_axes[j].vlines(acceleration_peak, y_min, y_max, 
    #     #                           'tab:orange', zorder=3)
    #     all_figure_axes[j].label_outer()

# intensity plots       
    # for i in enumerate(intensity): 
    #     label = ('intensity' if i == 0 else None)
    #     j = i[0] + acceleration_columns_number + rotation_columns_number
    #     all_figure_axes[j].\
    #         plot(time, intensity.iloc[:, i[0]],'tab:purple',
    #              marker ='.',markersize = 3 ,label=label)
    #     all_figure_axes[j].set_ylabel(i[1],rotation=0,ha ='right')
       
    #     if (i[0] == 0): 
    #         if y_limits != 0:
    #             all_figure_axes[j].set_ylim(y_limits['intensity_lin'])
    #             y_min = y_limits['intensity_lin'][0]
    #             y_max = y_limits['intensity_lin'][1]
    #         else:
    #             y_min = all_figure_axes[j].get_ylim()[0]
    #             y_max = all_figure_axes[j].get_ylim()[1]
       
    #     all_figure_axes[j].vlines(metronome_beat, y_min, y_max,
    #                               'tab:blue', zorder=3) 
    #     all_figure_axes[j].vlines(metronome_bar, y_min, y_max, 
    #                               'black', zorder=3, linewidths = 2) 
    #     #all_figure_axes[j].vlines(sensors_beat, y_min, y_max, 'tab:blue') 
    #     # all_figure_axes[j].vlines(acceleration_beat, y_min, y_max, 'tab:cyan')
    #     all_figure_axes[j].vlines(acceleration_peak, y_min, y_max, 
    #                               'tab:orange', zorder=3)

                      
    #     if (i[0] == 1): 
    #         if y_limits != 0:
    #             all_figure_axes[j].set_ylim(y_limits['intensity_comp'])
    #             y_min = y_limits['intensity_comp'][0]
    #             y_max = y_limits['intensity_comp'][1]
    #         else:
    #             y_min = all_figure_axes[j].get_ylim()[0]
    #             y_max = all_figure_axes[j].get_ylim()[1]
            
    #     all_figure_axes[j].vlines(metronome_beat, y_min, y_max,
    #                               'tab:blue', zorder=3) 
    #     all_figure_axes[j].vlines(metronome_bar, y_min, y_max, 
    #                               'black', zorder=3, linewidths = 2) 
    #     #all_figure_axes[j].vlines(sensors_beat, y_min, y_max, 'tab:blue') 
    #     # all_figure_axes[j].vlines(acceleration_beat, y_min, y_max, 'tab:cyan')
    #     all_figure_axes[j].vlines(acceleration_peak, y_min, y_max, 
    #                               'tab:orange', zorder=3)

    #     all_figure_axes[j].label_outer()
    
  
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
