// lib/wifi_switch.dart

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class WiFiSwitch extends StatefulWidget {
  final DatabaseReference podRef;

  const WiFiSwitch({super.key, required this.podRef});

  @override
  State<WiFiSwitch> createState() => _WiFiSwitchState();
}

class _WiFiSwitchState extends State<WiFiSwitch> {
  bool isHotspot = false;

  @override
  void initState() {
    super.initState();

    // Sync from Firebase
    widget.podRef.child('WI-FI/mode').onValue.listen((event) {
      final val = event.snapshot.value as int?;
      if (val != null) {
        setState(() {
          isHotspot = val == 1;
        });
      }
    });
  }

  void _setMode(bool value) {
    widget.podRef.child('WI-FI/mode').set(value ? 1 : 0);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.15),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'WiFi Mode',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isHotspot ? 'Mode: Hotspot' : 'Mode: Home',
                  style: const TextStyle(fontSize: 16),
                ),
                Switch(
                  value: isHotspot,
                  activeColor: Colors.blue,
                  onChanged: _setMode,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
