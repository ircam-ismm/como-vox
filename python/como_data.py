#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import glob
import json
import os

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


def sensors_read(filename):
    """Read filename that contains sensors values, with line as JSON.

    Args:
        filename

    Returns:
        {'index', 'time', 'acceleration', 'rotation', 'intensity'}

        with:
        - time in seconds
        - acceleration as pandas
        - rotation as pandas
        - intensity as pandas
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
                               'accelerationBandpass5hz.x': 'acc_bp.x',
                               'accelerationBandpass5hz.y': 'acc_bp.y',
                               'accelerationBandpass5hz.z': 'acc_bp.z',
                               'rotationRate.alpha': 'rot.alpha',
                               'rotationRate.beta': 'rot.beta',
                               'rotationRate.gamma': 'rot.gamma',
                               'intensity.linear': 'intensity.linear',
                               'intensity.compressed': 'intensity.compressed',
                               },
                      inplace=True)

    index = data_frame.loc[0, 'id']
    time = data_frame.loc[:, 'time']

    acceleration = data_frame.loc[:, ['acc.x', 'acc.y', 'acc.z']]
    acceleration_bandpass = data_frame.loc[:, ['acc_bp.x', 'acc_bp.y', 'acc_bp.z']]
    rotation = data_frame.loc[:, ['rot.alpha', 'rot.beta', 'rot.gamma']]
    intensity = data_frame.loc[:, ['intensity.linear', 'intensity.compressed']]

    return {'index': index, 'time': time,
            'acceleration': acceleration,
            'acceleration_bandpass': acceleration_bandpass,
            'rotation': rotation,
            'intensity': intensity}


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


def sensors_plot(sensors, figures=None):
    """Plot sensor values.

    Args:
        sensors as dict of {'index', 'time', 'acceleration', 'rotation', 'intensity'}
        figures as None or existing figure to add plots to it

    Returns:
        dict of figures {'acceleration', 'rotation', 'intensity'}
    """
    index = sensors['index']
    time = sensors['time']

    acceleration = sensors['acceleration']
    acceleration_columns_number = acceleration.shape[1]
    if figures:
        acceleration_figure = figures['acceleration']
        acceleration_axes = acceleration_figure.axes
    else:
        acceleration_figure = plt.figure()
        acceleration_axes = acceleration_figure.subplots(
            acceleration_columns_number,
            sharex=True, sharey=True)

        for i in range(0, acceleration_columns_number):
            acceleration_axes[i] = plt.subplot(
                acceleration_columns_number, 1, i+1,
                sharex=acceleration_axes[0])

        title = 'Acceleration'
        window_title = '{0} (Figure {1})' \
            .format(title, acceleration_figure.number)
        acceleration_figure.canvas.set_window_title(window_title)
        acceleration_figure.suptitle(title)

    for i in range(0, acceleration_columns_number):
        # labels or global in figure, not in sub-plots
        label = (index if i == 0 else None)

        acceleration_axes[i].plot(time, acceleration.iloc[:, i],
                                  label=label)

    acceleration_figure.legend()
    acceleration_figure.show()

    acceleration_bandpass = sensors['acceleration_bandpass']
    acceleration_bandpass_columns_number = acceleration_bandpass.shape[1]
    if figures:
        acceleration_bandpass_figure = figures['acceleration_bandpass']
        acceleration_bandpass_axes = acceleration_bandpass_figure.axes
    else:
        acceleration_bandpass_figure = plt.figure()
        acceleration_bandpass_axes = acceleration_bandpass_figure.subplots(acceleration_bandpass_columns_number,
                                                    sharex=True, sharey=True)
        for i in range(0, acceleration_bandpass_columns_number):
            acceleration_bandpass_axes[i] = plt.subplot(acceleration_bandpass_columns_number, 1, i+1,
                                           sharex=acceleration_axes[0])

        title = 'Acceleration_bandpass'
        window_title = '{0} (Figure {1})' \
            .format(title, acceleration_bandpass_figure.number)
        acceleration_bandpass_figure.canvas.set_window_title(window_title)
        acceleration_bandpass_figure.suptitle(title)

    for i in range(0, acceleration_bandpass_columns_number):
        # labels or global in figure, not in sub-plots
        label = (index if i == 0 else None)
        acceleration_bandpass_axes[i].plot(time, acceleration_bandpass.iloc[:, i],
                              label=label)

    acceleration_bandpass_figure.legend()
    acceleration_bandpass_figure.show()

    rotation = sensors['rotation']
    rotation_columns_number = rotation.shape[1]
    if figures:
        rotation_figure = figures['rotation']
        rotation_axes = rotation_figure.axes
    else:
        rotation_figure = plt.figure()
        rotation_axes = rotation_figure.subplots(rotation_columns_number,
                                                 sharex=True, sharey=True)
        for i in range(0, rotation_columns_number):
            rotation_axes[i] = plt.subplot(rotation_columns_number, 1, i+1,
                                           sharex=acceleration_axes[0])

        title = 'Rotation'
        window_title = '{0} (Figure {1})' \
            .format(title, rotation_figure.number)
        rotation_figure.canvas.set_window_title(window_title)
        rotation_figure.suptitle(title)

    for i in range(0, rotation_columns_number):
        # labels or global in figure, not in sub-plots
        label = (index if i == 0 else None)
        rotation_axes[i].plot(time, rotation.iloc[:, i],
                              label=label)

    rotation_figure.legend()
    rotation_figure.show()

    intensity = sensors['intensity']
    intensity_columns_number = intensity.shape[1]
    if figures:
        intensity_figure = figures['intensity']
        intensity_axes = intensity_figure.axes
    else:
        intensity_figure = plt.figure()
        intensity_axes = intensity_figure.subplots(intensity_columns_number,
                                                   sharex=True, sharey=True)
        for i in range(0, intensity_columns_number):
            intensity_axes[i] = plt.subplot(intensity_columns_number, 1, i+1,
                                            sharex=acceleration_axes[0])

        title = 'intensity'
        window_title = '{0} (Figure {1})' \
            .format(title, intensity_figure.number)
        intensity_figure.canvas.set_window_title(window_title)
        intensity_figure.suptitle(title)

    for i in range(0, intensity_columns_number):
        # labels or global in figure, not in sub-plots
        label = (index if i == 0 else None)
        intensity_axes[i].plot(time, intensity.iloc[:, i],
                               label=label)

    intensity_figure.legend()
    intensity_figure.show()

    return {'acceleration': acceleration_figure,
            'acceleration_bandpass': acceleration_bandpass_figure,
            'rotation': rotation_figure,
            'intensity': intensity_figure}


def multiple_sensors_plot(mutiple_sensors, figures=None):
    """Plot multiple sensor values.

    Args:
        multiple_sensors as dict of sensors
        sensors as a dict of {'index', 'time', 'acceleration', 'rotation', 'intensity'}
        figures as None or existing figure to add plots to it

    Returns:
        dict of figures {'acceleration', 'rotation', 'intensity'}
    """
    for sensors in mutiple_sensors.values():
        figures = sensors_plot(sensors, figures)

    return figures
