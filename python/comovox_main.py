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

import comovox_data_read_plot as comovox

# %matplotlib



"""
User data

"""
folder_path = '/mypath'
filename = 'xxx-*'

# #folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/mesures-morgan-2020-12-21'

# #fabrice
# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2020-12-22-mesures-fabrice'
# filename = '20201222-*'#'20201221-*'

# morgan
# folder_path = '/Users/bevilacq/Documents/Projects/eduup2020/data/mesures/2020-12-21-mesures-morgan'
# filename = '20201221-*'




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

y_limits = {'acceleration':(-5,20),'rotation':(-150,150),'intensity_lin':(0,0.02),'intensity_comp':(0,0.05)}  # 0 = auto
y_limits = 0

#acceleeration
axis_weights_accel = [1,1,1]
integration_parameter = -0.8
rolling_window_accel = 10
compression = 1
scaling = 0.2
threshold = 0.1
median_window = 15
norepeat_interval = 20
detect = 1

#rotation
axis_weights_rotation = [1,1,1]
rolling_window_rotation = 20

save_figure = True
text ='1'


def make_figure(data_string, figure_no):
    # single data
    comovox.acceleration_analysis(data[data_string],
                                       axis_weights_accel,
                                       integration_parameter, 
                                       rolling_window_accel, 
                                       compression, 
                                       scaling, 
                                       threshold, 
                                       median_window,
                                       norepeat_interval, detect)
    comovox.rotation_analysis(data[data_string],axis_weights_rotation, rolling_window_rotation, 1)
    comovox.sensors_plot(data[data_string], data_string, y_limits, figure_no) 
    plt.figtext(0.15 ,0.93, 
                'ACC - ' + 
                ' | axis_weights_accel: ' + str(axis_weights_accel) + 
                ' | integration_parameter: ' + str(integration_parameter) +  
                ' | rolling_window_accel: ' + str(rolling_window_accel) +
                ' | compression: ' + str(compression) +
                ' | scaling: ' + str(scaling) +
                ' | threshold: ' + str(threshold) +
                ' | median_window: ' + str(median_window) +
                ' | norepeat_interval: ' + str(norepeat_interval) + 
                ' | detect: ' + str(detect),
                fontsize = 10)
    plt.figtext(0.15 ,0.91, 
                'ROT - ' + 
                ' | axis_weights_rotation: ' + str(axis_weights_accel) + 
                ' | rolling_window_rotation: ' + str(rolling_window_rotation),
                fontsize = 10)
    if save_figure == True:
        plt.savefig(folder_path + '/figures/' 
                    + data_string + '-' + text + '.png')

#single plot
make_figure(data_list[0], 1)

# looping over data list
for i in data_list:   
    make_figure(i, None)
    print(i)



"""
main
"""

# if __name__ == '__main__':
#   print('comovox_main executed')
# else:
#   print('comovox_main imported')