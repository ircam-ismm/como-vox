#!/usr/bin/env python3
# -*- coding: utf-8 -*-


import argparse # to drop? (autonomous script)

import threading # for OSC serveur to run in background

from pythonosc import dispatcher
from pythonosc import osc_server


osc_ip = "127.0.0.1"
osc_port = 8013


class Workspace:
    def __init__(self):
        self.init()

    def init(self):
        self.mubus = {}
        self.mubu_current = None
        self.buffer_current = None
        self.track_current = None

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


workspace = Workspace()


def workspace_init(address, *data):
    workspace.init()

def mubu_select(address, *data):
    reference = data[0]
    workspace.mubu_select(reference)

def buffer_select(address, *data):
    reference = data[0]
    workspace.buffer_select(reference)

def track_select(address, *data):
    reference = data[0]
    workspace.track_select(reference)

def track_append(address, *data):
    track = workspace.track_select()
    track.append(list(data))


def print_generic(address, *data):
    print("addr: {0}".format(address))
    print("data: {0}".format(data))
        

    
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ip",
                        default=osc_ip, help="The ip to listen on")
    parser.add_argument("--port",
                        type=int, default=osc_port,
                        help="The port to listen on")
    args = parser.parse_args()

    osc_ip = args.ip
    osc_port = args.port
    
dispatcher = dispatcher.Dispatcher()
dispatcher.map("/init", workspace_init)
dispatcher.map("/mubu", mubu_select)
dispatcher.map("/buffer", buffer_select)
dispatcher.map("/track", track_select)
dispatcher.map("/append", track_append)

#dispatcher.map("/*", print_generic)


server = osc_server.ThreadingOSCUDPServer((osc_ip, osc_port), dispatcher)
server_thread = threading.Thread(target=server.serve_forever)
        

print("Serving on {}".format(server.server_address))
  
try:
    server_thread.start()
    # server.serve_forever()
    
except:
    # keyboard interrupt and the like
    print("shutdown")
    server.shutdown()
    server.server_close()

