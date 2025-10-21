---
#layout: post
title: Raspberry pi – blinking led in morse
date: '2017-10-07 11:54:00'
tags:
- linux
- electronics
- opensource
author: Vignesh Ragupathy
comments: true
cover:
    image: ../../images/2017/11/blog.vikki_.in_led_pi.jpg
    alt: Raspberry pi blinking led
    hiddenInSingle: true
---

In my previous post i described how i created high available replicated storage with raspberrypi  
In this post i will guide you how to interface raspberry pi to blink a led in morse code for the user input.The same signal fed into the LED can be send to a radio transmitter and we can transmit it in radio frequency . Recently i starter learning morse code and i am going to apply a license for Amateur radio operator.

### What you need:

Raspberry PI Model 2 – 1GB  
Breadboard  
Jumper wires (Male to Female)  
LED  
220 ohm resistor

### Assembling the circuit:

To make the LED programmable we need to use one of the GPIO pin from raspberry pi. More details on GPIO here.Python has a library “RPi.GPIO” to interface with raspberry pi. We are going to use this library to designates the GPIO pins to digital inputs or outputs. When a pin turns from LOW (0) to HIGH (1), it supplies a 3.3v signal.

Below is the pin diagram of the raspberry pi B+ model

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2017/11/Raspberry-Pi-GPIO-Layout-Model-B-Plus.png" class="kg-image" alt="Raspberry-Pi-GPIO-Layout-Model-B-Plus"></figure><!--kg-card-end: image-->

We are going to use the GPIO pin 4 and a ground to programably control the led. Connect resistor and led as per the below diagram.

Once the circuit is ready we can power on the raspberry pi and connect to pi using SSH or VNC.

Below is my final assembled circuit.

<!--kg-card-begin: image--><figure class="kg-card kg-image-card"><img src="../../images/2017/11/blog.vikki_.in_led_pi.jpg" class="kg-image" alt="blog.vikki_.in_led_pi"></figure><!--kg-card-end: image-->

### Blinking LED from raspberry pi

Connect to raspberry pi using ssh or vnc, open vim and copy paste the below code and save it. But default vim don’t support syntax highlight in raspbian os,So modify the “vimrc” to enable syntax highlighting.

```bash

pi@raspberrypi ~/vikki/python $ sudo cat /etc/vim/vimrc
" Vim5 and later versions support syntax highlighting. Uncommenting the next
" line enables syntax highlighting by default.
"syntax on
syntax on

```

Below is the python code to blink the led . You can download the updated code from my github.  
The code is explained inside in comment section.

```python

# Import the GPIO and time libraries
import RPi.GPIO as GPIO
import time

# Set the pin designation type.
# In this case, we use BCM- the GPIO number- rather than the pin number itself.
GPIO.setmode (GPIO.BCM)

# So that you don't need to manage non-descriptive numbers,
# set "LIGHT" to 4 so that our code can easily reference the correct pin.
LIGHT = 4

# Because GPIO pins can act as either digital inputs or outputs,
# we need to designate which way we want to use a given pin.
# This allows us to use functions in the GPIO library in order to properly send and receive signals.
GPIO.setup(LIGHT,GPIO.OUT)


# Cause the light to blink 7 times and print a message each time.
# To blink the light, we call GPIO.output and pass as parameters the pin number (LIGHT) and the state we want.
# True sets the pin to HIGH (sending a signal), False sets it to LOW.
# To achieve a blink, we set the pin to High, wait for a fraction of a second, then set it to Low.
# Adding keyboard interrupt with try and except so that program terminates when user presses Ctrl+C.
try:
    while True:
        GPIO.output(LIGHT,True)
        time.sleep(0.5)
        GPIO.output(LIGHT,False)
        time.sleep(0.5)
        print("blink")
except KeyboardInterrupt:
    GPIO.cleanup()

```

Now run the python code and verify the LED start blinking.

### Demo of LED blinking from raspberry pi:

<iframe width="560" height="315" src="https://www.youtube.com/embed/E78xxfEPwJc?si=hmr_y-5YQvxpEtda" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### Blinking LED in morse for user input:

Once we are able to blink the led from python ,we need to blink it in morse for the user input. Below is the python code to blink the led for morse. You can download the updated code from my github.I just added few lines to the previous code to blink for morse.

```python

# Import the GPIO and time libraries
import RPi.GPIO as GPIO
import time

#####Morse code ######
CODE = {' ': ' ',
        "'": '.----.',
        '(': '-.--.-',
        ')': '-.--.-',
        ',': '--..--',
        '-': '-....-',
        '.': '.-.-.-',
        '/': '-..-.',
        '0': '-----',
        '1': '.----',
        '2': '..---',
        '3': '...--',
        '4': '....-',
        '5': '.....',
        '6': '-....',
        '7': '--...',
        '8': '---..',
        '9': '----.',
        ':': '---...',
        ';': '-.-.-.',
        '?': '..--..',
        'A': '.-',
        'B': '-...',
        'C': '-.-.',
        'D': '-..',
        'E': '.',
        'F': '..-.',
        'G': '--.',
        'H': '....',
        'I': '..',
        'J': '.---',
        'K': '-.-',
        'L': '.-..',
        'M': '--',
        'N': '-.',
        'O': '---',
        'P': '.--.',
        'Q': '--.-',
        'R': '.-.',
        'S': '...',
        'T': '-',
        'U': '..-',
        'V': '...-',
        'W': '.--',
        'X': '-..-',
        'Y': '-.--',
        'Z': '--..',
        '_': '..--.-'}
######End of morse code######

# Set the pin designation type.
# In this case, we use BCM- the GPIO number- rather than the pin number itself.
GPIO.setmode (GPIO.BCM)

# So that you don't need to manage non-descriptive numbers,
# set "LIGHT" to 4 so that our code can easily reference the correct pin.
LIGHT = 4

# Because GPIO pins can act as either digital inputs or outputs,
# we need to designate which way we want to use a given pin.
# This allows us to use functions in the GPIO library in order to properly send and receive signals.
GPIO.setup(LIGHT,GPIO.OUT)


def dot():
        GPIO.output(LIGHT,True)
        time.sleep(0.2)
        GPIO.output(LIGHT,False)
        time.sleep(0.2)

def dash():
        GPIO.output(LIGHT,True)
        time.sleep(0.5)
        GPIO.output(LIGHT,False)
        time.sleep(0.2)

try:
    while True:
        input = raw_input('What would you like to send? ')
        for letter in input:
            for symbol in CODE[letter.upper()]:
                if symbol == '-':
                    dash()
                elif symbol == '.':
                    dot()
                else:
                    time.sleep(0.5)
            time.sleep(0.5)
except KeyboardInterrupt:
    GPIO.cleanup()

```
### Demo of LED blinking in Morse for the user input:

<iframe width="560" height="315" src="https://www.youtube.com/embed/IOO3adVXPYk?si=9G-TOx5Bl5aTU_YU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

