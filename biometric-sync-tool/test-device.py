#!/usr/bin/env python3
"""
ALMAGD Biometric - Test Device Connection
"""
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(SCRIPT_DIR)
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from zk import ZK  # bundled library

config_path = os.path.join(os.path.dirname(__file__), "config.json")
with open(config_path, "r", encoding="utf-8-sig") as f:
    cfg = json.load(f)

dev = cfg["device"]
ip = dev.get("ip", "192.168.1.201")
port = dev.get("port", 4370)

print(f"Testing connection to Fingerspot Revo at {ip}:{port}...")

try:
    zk = ZK(ip, port=port, timeout=5, force_udp=dev.get("force_udp", True), password=int(dev.get("password", 0)))
    conn = zk.connect()
    print("==========================================")
    print("✓ SUCCESS! Connected to Biometric Device.")
    print("==========================================")
    print("Device Name:", conn.get_device_name())
    print("Serial Number:", conn.get_serialnumber())
    print("Firmware Version:", conn.get_firmware_version())
    print("Platform:", conn.get_platform())
    users = conn.get_users()
    print(f"Enrolled Users Count: {len(users)}")
    print("User registry (PIN -> device display name):")
    for user in users:
        print(f"  {user.user_id} -> {user.name}")
    atts = conn.get_attendance()
    print(f"Total Attendance Records in Device: {len(atts)}")
    if atts:
        last = atts[-1]
        print(f"Latest Punch: User ID {last.user_id} at {last.timestamp} (Punch {last.punch})")
    print("Recent raw scan times and movement codes:")
    for record in atts[-5:]:
        print(f"  PIN={record.user_id} time={record.timestamp} code={record.punch}")
    conn.disconnect()
except Exception as e:
    print("==========================================")
    print("✗ FAILED to connect:", e)
    print("Please check that:")
    print("1. Device IP is correct in config.json")
    print("2. Device is powered on and connected to the same LAN/Wi-Fi network")
    print("3. The terminal supports the bundled socket protocol; changing the port alone does not prove compatibility")
    sys.exit(1)
    print("==========================================")
