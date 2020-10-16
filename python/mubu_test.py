#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import mubu as MuBu

import matplotlib.pyplot as plt
plt.rcParams.update({'legend.fontsize': 'x-small',
#                     'axes.ymargin': 0.01,
                     })
#plt.style.use('dark_background')


import numpy as np

osc_receive_port = 8013
osc_send_port = 8014

global W

def workspace_initialise():
    global W
    if 'done' not in workspace_initialise.__dict__:
        W = MuBu.Workspace(osc_receive_port=osc_receive_port,
                           osc_send_port=osc_send_port)

        workspace_initialise.done = True

    return W


def workspace_tight_layout():
    for i in plt.get_fignums():
        plt.figure(i).tight_layout()


def workspace_track_plot(track_reference=None):
    global W

    W.track = np.array(W.track_select(track_reference))
    W.track_figure = plt.figure()
    title = "{0} {1} {2}".format(
        W.mubu_current, W.buffer_current, W.track_current)
    plt.title(title)
    W.track_figure.canvas.set_window_title(
        "Figure ({0}) - {1}".format(plt.get_fignums()[-1], title))

    columns_number = W.track.shape[1]
    for i in range(0, columns_number):
        plt.plot(W.track[:, i], label=i + 1)

    # W.track_figure.tight_layout()
    W.track_figure.legend()
    W.track_figure.show()


def workspace_buffer_plot(buffer_reference=None, sharex=None):
    global W

    W.buffer = W.buffer_select(buffer_reference)
    tracks_number = len(W.buffer.keys())
    W.buffer_figure = plt.figure()

    if sharex is not None:
        W.buffer_axes = []
        for i in range(0, tracks_number):
            W.buffer_axes.append(W.buffer_figure.add_subplot(
                tracks_number, 1, i+1, sharex=sharex))
    else:
        if tracks_number > 1:
            W.buffer_axes = W.buffer_figure.subplots(tracks_number, sharex=True)
        else:
            W.buffer_axes \
                = [W.buffer_figure.subplots(tracks_number, sharex=True)]

    title = "{0} {1}".format(W.mubu_current, W.buffer_current)

    track_id = 0
    for track_name in W.buffer.keys():
        W.track = np.array(W.track_select(track_name))
        if W.track.size == 0:
            plt.close(W.buffer_figure)
            return
        columns_number = W.track.shape[1]
        for i in range(0, columns_number):
            W.buffer_axes[track_id].plot(W.track[:, i], label=i + 1)

        W.buffer_axes[track_id].legend()
        W.buffer_axes[track_id].set_title("{0} {1}"
                                          .format(title, W.track_current))
        track_id += 1

    # W.buffer_figure.tight_layout(h_pad=None, w_pad=None)
    W.buffer_figure.canvas.set_window_title(
        "Figure ({0}) - {1}".format(plt.get_fignums()[-1], title))

    W.buffer_figure.show()


def workspace_gestures_plot():
    global W
    W.mubu = W.mubu_select('covox_hhmm')
    for gesture in W.mubu.keys():
        workspace_buffer_plot(gesture)


def workspace_gestures_get():
    global W
    W.osc_client_send('/get', 'covox_hhmm')


def workspace_records_sharex_get():
    if 'records_sharex' not in W.__dict__:
        sharex = None
    else:
        sharex = W.records_sharex

    return sharex


def workspace_records_plot(buffer_reference=None,
                           mubu_reference=None,
                           ):
    global W
    sharex = workspace_records_sharex_get()

    W.mubu = W.mubu_select(mubu_reference)
    workspace_buffer_plot(buffer_reference, sharex=sharex)
    W.records_sharex = W.buffer_axes[0]


def workspace_records_get(mubu_reference='covox_hhmm'):
    global W
    W.osc_client_send('/get', mubu_reference)


def workspace_records_extra_plot(values, title=None):
    global W
    figure = plt.figure()
    sharex = workspace_records_sharex_get()
    axes = figure.add_subplot(1, 1, 1, sharex=sharex)

    columns_number = values.shape[1]
    for i in range(0, columns_number):
        axes.plot(values[:, i], label=i + 1)

    if title is not None:
        axes.set_title(title)
        figure.canvas.set_window_title("Figure ({0}) - {1}"
                                       .format(plt.get_fignums()[-1], title))
    figure.legend()
    figure.show()
    # figure.tight_layout(h_pad=None, w_pad=None)

    return figure, axes


def workspace_acceleration_set(gestures_number=3,
                               track_reference='acceleration',
                               buffer_reference=1,
                               mubu_reference='covox_hhmm',
                               ):
    global W
    W.mubu = W.mubu_select(mubu_reference)
    W.buffer = W.buffer_select(buffer_reference)
    W.track = W.track_select(track_reference)

    W.acceleration = np.array(W.track)[:, :gestures_number]


def workspace_acceleration_plot():
    global W
    title = "{0} {1} {2}" \
        .format(W.mubu_current, W.buffer_current, 'acceleration')
    W.acceleration_figure, W.acceleration_axes = \
        workspace_records_extra_plot(W.acceleration, title)


def workspace_rotation_set(gestures_number=3,
                           track_reference='rotation',
                           buffer_reference=1,
                           mubu_reference='covox_hhmm',
                           ):
    global W
    W.mubu = W.mubu_select(mubu_reference)
    W.buffer = W.buffer_select(buffer_reference)
    W.track = W.track_select(track_reference)

    W.rotation = np.array(W.track)[:, :gestures_number]


def workspace_rotation_plot():
    global W
    title = "{0} {1} {2}" \
        .format(W.mubu_current, W.buffer_current, 'rotation')
    W.rotation_figure, W.rotation_axes = \
        workspace_records_extra_plot(W.rotation, title)



def workspace_descriptors_set(gestures_number=8,
                              track_reference='descriptors',
                              buffer_reference=1,
                              mubu_reference='covox_hhmm',
                              ):
    global W
    W.mubu = W.mubu_select(mubu_reference)
    W.buffer = W.buffer_select(buffer_reference)
    W.track = W.track_select(track_reference)

    W.descriptors = np.array(W.track)[:, :gestures_number]


def workspace_descriptors_plot():
    global W
    title = "{0} {1} {2}" \
        .format(W.mubu_current, W.buffer_current, 'descriptors')
    W.descriptors_figure, W.descriptors_axes = \
        workspace_records_extra_plot(W.descriptors, title)


def acceleration_tmp_plot():
    sharex = workspace_records_sharex_get()

    acceleration_columns_number = 3
    acceleration_figure = plt.figure()
    acceleration_axes = acceleration_figure.subplots(
        acceleration_columns_number,
        sharex=True, sharey=True)

    for i in range(0, acceleration_columns_number):
        # labels or global in figure, not in sub-plots
        label = 'riot'

        acceleration_axes[i].plot(W.acceleration[:, i],
                                  label=label)

    acceleration_figure.legend()
    acceleration_figure.show()

def rotation_tmp_plot():
    sharex = workspace_records_sharex_get()

    rotation_columns_number = 3
    rotation_figure = plt.figure()
    rotation_axes = rotation_figure.subplots(
        rotation_columns_number,
        sharex=True, sharey=True)

    for i in range(0, rotation_columns_number):
        # labels or global in figure, not in sub-plots
        label = 'riot'

        rotation_axes[i].plot(W.rotation[:, i],
                              label=label)

    rotation_figure.legend()
    rotation_figure.show()

