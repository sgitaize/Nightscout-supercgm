top = '.'
out = 'build'

def options(ctx):
    ctx.load('pebble_sdk')

def configure(ctx):
    ctx.load('pebble_sdk')

def build(ctx):
    ctx.load('pebble_sdk')
    # Define the C watchface program target
    ctx.pbl_program(source=['src/main.c'], target='supercgm-ns')
    # Bundle everything into a PBW for each platform
    ctx.pbl_bundle()
