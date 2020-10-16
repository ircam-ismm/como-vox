#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import threading # for OSC serveur to run in background

from pythonosc import dispatcher
from pythonosc import osc_server
from pythonosc import udp_client

class MuBu_OSC_Workspace:
    
    def __init__(self, osc_send_port = 8014, osc_receive_port = 8013,
                 osc_send_ip = "127.0.0.1", osc_receive_ip = "127.0.0.1"):
        self.init()

        self.osc_receive_ip = osc_receive_ip
        self.osc_receive_port = osc_receive_port

        self.osc_send_ip = osc_send_ip
        self.osc_send_port = osc_send_port

        self.dispatcher = dispatcher.Dispatcher()
        self.dispatcher.map("/init", self._osc_workspace_init)
        self.dispatcher.map("/mubu", self._osc_mubu_select)
        self.dispatcher.map("/buffer", self._osc_buffer_select)
        self.dispatcher.map("/track", self._osc_track_select)
        self.dispatcher.map("/append", self._osc_track_append)
        
        self.dispatcher.map("/done", self._osc_done)
        # self.dispatcher.map("/*", self._osc_print_generic)

        self.osc_server_start()
        self.osc_client_start()

        self.mutex = threading.Lock()

    def __del__(self):
        try:
            self.osc_server_stop()
            self.osc_server_thread.join()
        except:
            pass

    def init(self):
        self.mubus = {}
        self.mubu_current = None
        self.buffer_current = None
        self.track_current = None
        
        self.osc_done_callback = None


    def mubu_select(self, reference = None):
        if reference is None:
            reference = self.mubu_current

        self.mubu_current = reference
        if reference not in self.mubus.keys():
            self.mubus[reference] = {}
                
        return self.mubus[reference]

    def buffer_select(self, reference = None):
        mubu = self.mubu_select()
        if reference is None:
            reference = self.buffer_current

        self.buffer_current = reference
        if reference not in mubu.keys():
            mubu[reference] = {}
                
        return mubu[reference]

    def track_select(self, reference = None):
        buffer = self.buffer_select()
        if reference is None:
            reference = self.track_current

        self.track_current = reference
        if reference not in buffer.keys():
            buffer[reference] = []
            
        return buffer[reference]
    

    def osc_server_start(self):
        # self.osc_server = osc_server.ThreadingOSCUDPServer(
        #         (self.osc_receive_ip, self.osc_receive_port), self.dispatcher)
        self.osc_server = osc_server.BlockingOSCUDPServer(
                (self.osc_receive_ip, self.osc_receive_port), self.dispatcher)


        self.osc_server_thread = threading.Thread(target = self.osc_server.serve_forever)
                  
        try:
            self.osc_server_thread.start()
            print("Serving on {}".format(self.osc_server.server_address))
        except:
            print("OSC server exception. Stopping")
            # keyboard interrupt and the like
            self.osc_server_stop()

    def osc_server_stop(self):
        print("OSC server {0}:{1} shutdown".format(self.osc_receive_ip, self.osc_receive_port))
        self.osc_server.shutdown()
        self.osc_server.server_close()
        print("OSC server {0}:{1} closed".format(self.osc_receive_ip, self.osc_receive_port))

    def osc_client_start(self):
        print("OSC client sending to {0}:{1}".format(self.osc_send_ip, self.osc_send_port))
        self.osc_client = udp_client.SimpleUDPClient(self.osc_send_ip, self.osc_send_port)

    def osc_client_send(self, address, *data):
        self.osc_client.send_message(address, list(data))

    def _osc_workspace_init(self, address, *data):
        del address, data # unused
        with self.mutex:
            print("init")
            self.init()

    def _osc_mubu_select(self, address, *data):
        del address # unused
        reference = data[0]
        with self.mutex:
            mubu = self.mubu_select(reference)
            mubu.clear()

    def _osc_buffer_select(self, address, *data):
        del address # unused
        reference = data[0]
        with self.mutex:
            buffer_ = self.buffer_select(reference)
            buffer_.clear()

    def _osc_track_select(self, address, *data):
        del address # unused
        reference = data[0]
        with self.mutex:
            track = self.track_select(reference)
            track.clear()

    def _osc_track_append(self, address, *data):
        del address # unused
        with self.mutex:
            track = self.track_select()
            track.append(list(data))

    def _osc_done(self, address, *data):
        del address, data # unused
        with self.mutex:
            if self.osc_done_callback is not None:
                self.osc_done_callback()
            else:
                print("done")

    def _osc_print_generic(self, address, *data):
        with self.mutex:
            print("addr: {0}".format(address))
            print("data: {0}".format(data))

#workspace = MuBu_OSC_Workspace()
