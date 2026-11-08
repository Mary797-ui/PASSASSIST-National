"""
Tamper-evident audit-chain demonstration.
Only non-sensitive operational event metadata is included.
Never place passport scans, ID numbers, names, or personal records on-chain.
"""
import hashlib, json
from datetime import datetime, timezone

def canonical_json(record):
    return json.dumps(record, sort_keys=True, separators=(",", ":"))

def event_hash(event, previous_hash):
    payload = previous_hash + canonical_json(event)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def build_chain(events):
    chain=[]
    previous="0"*64
    for index,event in enumerate(events, start=1):
        digest=event_hash(event,previous)
        chain.append({"index":index,"event":event,"previous_hash":previous,"hash":digest})
        previous=digest
    return chain

def verify_chain(chain):
    previous="0"*64
    for block in chain:
        if block["previous_hash"] != previous:
            return False
        if event_hash(block["event"],previous) != block["hash"]:
            return False
        previous=block["hash"]
    return True

if __name__ == "__main__":
    demo_events=[
        {"event_type":"APPLICATION_RECEIVED","office_code":"MAS-HO","record_ref":"DEMO-0001","occurred_at":"2025-01-02T09:00:00Z"},
        {"event_type":"APPLICATION_PROCESSED","office_code":"MAS-HO","record_ref":"DEMO-0001","occurred_at":"2025-01-04T10:30:00Z"},
        {"event_type":"PASSPORT_PRINTED","office_code":"MAS-HO","record_ref":"DEMO-0001","occurred_at":"2025-01-08T14:15:00Z"}
    ]
    chain=build_chain(demo_events)
    print("Valid chain:",verify_chain(chain))
    altered=[dict(x) for x in chain]
    altered[1]=dict(altered[1])
    altered[1]["event"]=dict(altered[1]["event"],office_code="LER-HO")
    print("Valid after alteration:",verify_chain(altered))
