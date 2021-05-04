#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Dec 17 13:10:11 2020

@author: bevilacq
"""

# import glob
# import json
# import os

import matplotlib.pyplot as plt
# import numpy as np
# import pandas as pd
# import seaborn as sns

import comovox_data_read_plot_test as comovox
# import comovox_data_read_plot_2020_1 as comovox

# %matplotlib



"""
User data

"""
# folder_path = '/mypath'
# filename = 'xxx-*'

# folder_path = \
#   '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/data-test'
# filename = '2021*'

# #fabrice
# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2020-12-22-mesures-fabrice'
# filename = '20201222-*'

# morgan
# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2020-12-21-mesures-morgan'
# filename = '20201221-*'

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/data-test'
# filename = '20210222-*'

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2021-02-16-mesures-caroline'
# filename = '20210216-*'

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2021-02-12-mesures-lucie-olivier'
# filename = '20210212-*'

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2021-02-23-mesures-sebastien'
# filename = '20210223-*'

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2021-03-12-benjamin'
# filename = '20210312-*'

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2021-03-15-morgan'
# filename = '20210315-*'

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2021-03-22-fred-jp'
# filename = '20210322-*'

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2021-03-29-morgan'
# filename = '20210329-*'

folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2021-04-14-fred'
filename = '20210414-*'




"""
read files

"""
readfile = True

if readfile:
    data = comovox.multiple_sensors_read(folder_path + '/' + filename)
    data_list = [*data]
    data_list.sort()
    print('data read')
else:
    print('data not reloaded')



"""
plot figures

"""

y_limits = {'acceleration':(-5,20),'rotation':(-150,150),
            'intensity_lin':(0,0.02),'intensity_comp':(0,0.05)}  # 0 = auto
y_limits = 0

#acceleeration
axis_weights_accel = [1,0,0]
integration_parameter = -0.8
acceleration_average_order = 2
compression = 1
scaling = 1
delta_order= 10

threshold = 1
threshold_min = 10
onset_order = 10  #10
inhibition_duration = 20
peak_search_window = 20
detect_up = 1

#rotation
axis_weights_rotation = [1,1,1]
rotation_average_order = 20
rotation_threshold = {
    'safe': 1,
    'sensitive': 1,
  }


peak_threshold = {
    'safe': 100,
    'sensitive': 30,
  }


# adaptation

sampling_period = 0.02 # sedonds

inhibitionLimits = {
    'min': 0.25 / sampling_period,
    'max': 0.5 / sampling_period,
    'beats': 0.5 / sampling_period,
  };

peakSearchLimits = {
    'min': 0.25 / sampling_period,
    'max': 0.5 / sampling_period,
    'beats': 0.5 / sampling_period,
    # extension for 'max' and 'beats' when peak is still increasing at end of window
    'extensionFactor': 1.2,
  };


save_figure = False
text ='adapt4_delta_10_max'


beat_trigger = True   # displays beat detected in the phone (blue)
beat_offline = True  # displays beat detected re-calculated offline (orange)
metronome = False       # displays the metronome beats



def make_figure(data_string, figure_no):
    # single data
    comovox.rotation_analysis(data[data_string],
                                  axis_weights_rotation,
                                  rotation_average_order, 1)
    comovox.acceleration_analysis(data[data_string],
                                       axis_weights_accel,
                                       integration_parameter,
                                       acceleration_average_order,
                                       compression,
                                       scaling,
                                       delta_order,
                                       threshold, threshold_min,
                                       onset_order,
                                       inhibition_duration,
                                       peak_search_window,
                                       inhibitionLimits, peakSearchLimits,
                                       rotation_threshold,
                                       peak_threshold,
                                       detect_up)
    comovox.sensors_plot(data[data_string], data_string, y_limits,
                         beat_trigger, beat_offline,
                         metronome, figure_no)
    plt.figtext(0.15 ,0.93,
                'ACC - ' +
                ' | axis_weights_accel: ' + str(axis_weights_accel) +
                ' | integration_parameter: ' + str(integration_parameter) +
                ' | accel_average_order: ' + str(acceleration_average_order) +
                ' | compression: ' + str(compression) +
                ' | scaling: ' + str(scaling) +
                ' | threshold: ' + str(threshold) +
                ' | threshold_min: ' + str(threshold_min) +
                ' | inhibition_duration: ' + str(inhibition_duration) +
                ' | peak_search_window: ' + str(peak_search_window) +
                ' | rotation_threshold: ' + str(rotation_threshold) +
                ' | detect_up: ' + str(detect_up),
                fontsize = 10)
    plt.figtext(0.15 ,0.91,
                'ROT - ' +
                ' | axis_weights_rotation: ' + str(axis_weights_accel) +
                ' | rotation_average_order: ' + str(rotation_average_order),
                fontsize = 10)
    if save_figure == True:
        plt.savefig(folder_path + '/figures/'
                    + data_string + '-' + text + '.pdf')

#single plot
# data = {}

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2020-12-22-mesures-fabrice'
# filename = '20201222-162915-player-15-metro-80-4_4-nuances'
# data[filename] = comovox.sensors_read(folder_path + '/' + filename)
# # data = comovox.multiple_sensors_read(folder_path + '/' + filename)
# make_figure(filename, 1)

# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2020-12-21-mesures-morgan'
# filename = '20201221-131759-player-27-metro-80-4_4-nuances'
# data[filename] = comovox.sensors_read(folder_path + '/' + filename)
# make_figure(filename, 2)

# data_list = [*data]
# make_figure(data_list[0], 1)
# make_figure(data_list[1], 2)



# make_figure('20201221-123746-player-22-coule-60-2_4', 1)
# make_figure('20201221-123333-player-22-coule-60', 2)
# make_figure('20201221-131759-player-27-metro-80-4_4-nuances', 3)
# make_figure('20201222-162915-player-15-metro-80-4_4-nuances', 4)


#looping over data_list
for i in data_list:
    make_figure(i, None)
    print(i)

# make_figure(data_list[13], None)



"""
main
"""

# if __name__ == '__main__':
#   print('comovox_main executed')
# else:
#   print('comovox_main imported')
