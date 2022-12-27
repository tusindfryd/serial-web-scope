import serial
import random
from time import sleep
from math import sin, pi, radians, cos
port = serial.Serial('COM1', baudrate = 115200)

i = 0
while True:
    message = f'{{ "Channel 1": {sin(i)}, "Channel 2": {cos(i)}, "Channel 3": {sin(i+0.5)}, "Channel 4": {cos(i+0.3)}}}\r\n'
    # message = f'{{ "Channel 1": {sin(i)}, "Channel 2": {cos(i)}}}\n'
    # message = f'{sin(i)}\r\n'
    # message = f'{sin(i)}\n'
    # message = f'{sin(i)}, {cos(i)}\n'
    i = (i + 0.05) % (2 * pi)
    # message = f'{{ "Channel 1": {random.randint(1, 1000)}, "Channel 2": {random.randint(1, 1000)}, "Channel 3": {random.randint(1, 1000)} }}\r\n'
    port.write(message.encode())
    sleep(0.1)