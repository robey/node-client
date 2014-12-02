{Base} = require './base'
log = require '../log'
{add_option_dict} = require './argparse'
{E} = require '../err'
{TrackSubSubCommand} = require '../tracksubsub'
{BufferInStream} = require('iced-spawn')
{master_ring} = require '../keyring'
{make_esc} = require 'iced-error'
{dict_union} = require '../util'
{User} = require '../user'
{env} = require '../env'

##=======================================================================

exports.Command = class Command extends Base

  #----------

  OPTS : dict_union TrackSubSubCommand.OPTS, {
    s:
      alias : "sign"
      action : "storeTrue"
      help : "sign in addition to encrypting"
    m:
      alias : "message"
      help : "provide the message on the command line"
    "message6":
      help : "provide the message on the command line, as base64"
    b :
      alias : 'binary'
      action: "storeTrue"
      help : "output in binary (rather than ASCII/armored)"
    '6' :
      alias : "base64"
      action : "storeTrue"
      help : "output result as base64-encoded binary data (rather than ASCII/armored)"
    o :
      alias : 'output'
      help : 'the output file to write the encryption to'
  }

  #----------

  add_subcommand_parser : (scp) ->
    opts =
      aliases : [ "enc" ]
      help : "encrypt a message and output to stdout or a file"
    name = "encrypt"
    sub = scp.addParser name, opts
    add_option_dict sub, @OPTS
    sub.addArgument [ "them" ], { nargs : 1 , help : "the username of the receiver" }
    sub.addArgument [ "file" ], { nargs : '?', help : "the file to be encrypted" }
    return opts.aliases.concat [ name ]

  #----------

  do_encrypt : (cb) ->
    tp = @them.fingerprint true
    ti = @them.key_id_64()
    args = [
      "--encrypt",
      "-r", tp,
      "--trust-mode", "always"
    ]
    if @argv.sign
      sign_key = if @is_self then @them else @tssc.me
      args.push( "--sign", "-u", (sign_key.fingerprint true) )
    gargs = { args }
    gargs.quiet = true
    args.push("--output", o, "--yes") if (o = @argv.output)
    args.push "-a"  unless @argv.binary
    if @argv.message
      gargs.stdin = new BufferInStream @argv.message
    else if @argv.message6
      gargs.stdin = new BufferInStream(new Buffer(@argv.message6, "base64"))
    else if @argv.file?
      args.push @argv.file
    else
      gargs.stdin = process.stdin
    await master_ring().gpg gargs, defer err, out
    unless @argv.output?
      if @argv.base64
        await process.stdout.write out.toString("base64"), defer()
      else if @argv.binary
        await process.stdout.write out, defer()
      else
        log.console.log out.toString('utf8')
    cb err

  #----------

  run : (cb) ->
    esc = make_esc cb, "Command::run"
    batch = (not @argv.message and not @argv.file?)

    # We tetnatively resolve usernames of the form twitter://foo to
    # foo_keybase, but we still need to assert it's the right person
    # later on.
    await User.resolve_user_name { username : @argv.them[0] }, esc defer them_un, assertions

    if env().is_me them_un
      @is_self = true
      await User.load_me { secret : true }, esc defer @them
    else
      @is_self = false
      @tssc = new TrackSubSubCommand { args : { them : them_un }, opts : @argv, batch, assertions }
      await @tssc.pre_encrypt esc defer()
      @them = @tssc.them
    await @do_encrypt esc defer()
    cb null

##=======================================================================

