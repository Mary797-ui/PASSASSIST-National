from blockchain.audit_chain_demo import build_chain, verify_chain

def test_chain_verifies():
    events=[{"event_type":"RECEIVED","record_ref":"DEMO-1"}]
    assert verify_chain(build_chain(events))

def test_tampering_is_detected():
    events=[{"event_type":"RECEIVED","record_ref":"DEMO-1"}]
    chain=build_chain(events)
    chain[0]["event"]["record_ref"]="DEMO-2"
    assert not verify_chain(chain)
