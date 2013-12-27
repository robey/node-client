
{db} = require './db'
{constants} = require './constants'
log = require './log'
{proof_type_to_string} = require 'keybase-proofs'
ST = constants.signature_types
deq = require 'deep-equal'

##=======================================================================

exports.Track = class Track

  constructor : ({@trackee, @local, @remote}) ->
    @uid = @trackee.id
    @sig_chain = @trackee.sig_chain

  #--------

  last : () -> @sig_chain.last()
  table : () -> @sig_chain.table[ST.REMOTE_PROOF]

  #--------

  _check_remote_proof : (rp) ->
    if not (rkp = rp.remote_key_proof)? 
      new E.RemoteProofError "no 'remote_key_proof field'"
    else if ((a = rkp.check_data_json?.name) isnt (b = (proof_type_to_string rkp.proof_type)))
      new E.RemoteProofError "name mismatch: #{a} != #{b}"
    else if not (link = @sig_chain.lookup[rp.curr])?
      new E.RemoteProofError "Failed to find a chain link for #{rp.curr}"
    else if not deq(link.payload_json()?.service, rkp.check_json_data)
      new E.RemoteProofError "The check data was wrong for the signature"
    else null

  #--------

  # Check the tracking object for internal consistency. These checks should
  # actually never fail, unless there was a bug in the client.
  _check_track_obj : (o) ->
    err = if (a = o.id) isnt (b = @trackee.id) then new E.UidMismatch "#{a} != #{b}"
    else ((a = o.basics?.username) isnt (b = @trackee.username()))
      new E.UsernameMismatch "#{a} != #{b}"
    else
      for rp in o.remote_proofs when not err?
        err = @_check_remote_proof rp
    return err 

  #--------

  _skip_remote_check : (track_cert) ->
    rpri = constants.time.remote_proof_recheck_interval
    (track_cert? and 
     (last = @last()?) and 
     (last_check = last?.ctime)? and
     (last_change = track_cert.ctime)? and
     (last_check - last_change > rpri) and
     (track_cert.seq_tail?.payload_hash is last.id))

  #--------

  skip_remote_check : () ->
    (@_skip_remote_check @local) or (@_skip_remote_check @remote)

  #--------

  load_local : (cb) ->
    log.debug "+ getting local tracking info from DB"
    await db.get { type : constants.ids.local_track, key : @uid }, defer err, value
    @local = value
    log.debug "- completed, with result: #{!!value}"
    cb err

  #--------

  check : () ->
    if @local and (e = @_check_track_obj @local)?
      log.warn "Local tracking object was invalid: #{e.message}"
      @local = null
    if @remote? and (e = @_check_track_obj @remote)?
      log.warn "Remote tracking object was invalid: #{e.message}"
      @remote = null

  #--------

  @load : ({tracker, trackee}, cb) ->
    log.debug "+ loading Tracking info w/ remote=#{!!remote}"
    uid = trackee.id
    remote = tracker?.sig_chain?.get_track uid
    await check_remote_track remote, defer err
    track = null
    unless err?
      track = new Track { uid, trackee, remote  }
      await track.load_local defer err
      track = null if err? 
    track?.check()
    log.debug "- loaded tracking info"
    cb err, track

##=======================================================================
