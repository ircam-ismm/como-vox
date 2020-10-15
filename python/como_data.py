#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import glob
import os

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


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

    data = pd.read_json(filename, lines='true')

    metas = pd.DataFrame(data['metas'].to_list(),
                         index=data.index,
                         columns=['id', 'time', 'deltaT'])

    index = metas['id'][0]
    time = metas['time']

    acceleration = pd.DataFrame(data['accelerationIncludingGravity'].to_list(),
                                index=data.index,
                                columns=['ax', 'ay', 'az'])

    rotation = pd.DataFrame(data['rotationRate'].to_list(),
                            index=data.index,
                            columns=['gx', 'gy', 'gz'])

    return {'index': index, 'time': time,
            'acceleration': acceleration,
            'rotation': rotation}


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
        sensors as dict of {'index', 'time', 'acceleration', 'rotation'}
        figures as None or existing figure to add plots to it

    Returns:
        dict of figures {'acceleration', 'rotation'}
    """

    index = sensors['index']
    time = sensors['time']
    acceleration = sensors['acceleration']
    rotation = sensors['rotation']

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
        window_title = '{0} (Figure {1})'\
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
        window_title = '{0} (Figure {1})'\
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

    return {'acceleration': acceleration_figure,
            'rotation': rotation_figure}


def multiple_sensors_plot(mutiple_sensors, figures=None):
    """Plot multiple sensor values.

    Args:
        multiple_sensors as dict of sensors
        sensors as a dict of {'index', 'time', 'acceleration', 'rotation'}
        figures as None or existing figure to add plots to it

    Returns:
        dict of figures {'acceleration', 'rotation'}
    """

    for sensors in mutiple_sensors.values():
        figures = sensors_plot(sensors, figures)

    return figures
