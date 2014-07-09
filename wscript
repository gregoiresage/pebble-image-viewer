
#
# This file is the default set of rules to compile a Pebble project.
#
# Feel free to customize this to your needs.
#

top = '.'
out = 'build'

def options(ctx):
    ctx.load('pebble_sdk')

def configure(ctx):
    ctx.load('pebble_sdk')

def build(ctx):
    ctx.load('pebble_sdk')

    ctx.pbl_program(source=ctx.path.ant_glob('src/**/*.c'),
                    target='pebble-app.elf')

    ctx(rule='cat ${SRC} > ${TGT}', source=ctx.path.ant_glob('src/js/**/*.js'), target='pebble-js-app.js')

    ctx.pbl_bundle(elf='pebble-app.elf',
                   js='pebble-js-app.js')
