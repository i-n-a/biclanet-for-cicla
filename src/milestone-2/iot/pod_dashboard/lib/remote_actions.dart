// lib/remote_actions.dart

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class RemoteActions extends StatefulWidget {
  final DatabaseReference lightPodRef;
  final DatabaseReference lockerPodRef;

  const RemoteActions(
      {super.key, required this.lightPodRef, required this.lockerPodRef});

  @override
  State<RemoteActions> createState() => _RemoteActionsState();
}

class _RemoteActionsState extends State<RemoteActions> {
  bool manualOverride = false;
  bool manualToggle = false;

  int doorStatus = 0; // 0 closed, 1 opening, 2 open, 3 closing
  int spotStatus = 0;

  bool isProcessingDoor = false;
  bool isProcessingSpot = false;

  @override
  void initState() {
    super.initState();

    // Light mode
    widget.lightPodRef.child('settings/light_mode').onValue.listen((event) {
      final data = event.snapshot.value as Map<Object?, Object?>?;
      if (data == null) return;

      setState(() {
        manualOverride = (data['manual_override'] as int? ?? 0) == 1;
        manualToggle = (data['manual_toggle'] as int? ?? 0) == 1;
      });
    });

    // Door
    widget.lockerPodRef.child('door_state').onValue.listen((event) {
      final val = event.snapshot.value as int? ?? 0;
      setState(() {
        doorStatus = val;
        isProcessingDoor = val == 1 || val == 3;
      });
    });

    // Spot - assuming similar path, adjust if different
    widget.lockerPodRef.child('spot_state').onValue.listen((event) {
      final val = event.snapshot.value as int? ?? 0;
      setState(() {
        spotStatus = val;
        isProcessingSpot = val == 1 || val == 3;
      });
    });
  }

  void _setOverride(bool value) {
    widget.lightPodRef
        .child('settings/light_mode/manual_override')
        .set(value ? 1 : 0);
  }

  void _setToggle(bool value) {
    widget.lightPodRef
        .child('settings/light_mode/manual_toggle')
        .set(value ? 1 : 0);
  }

  void _setDoor(bool open) {
    int status = open ? 1 : 3;
    widget.lockerPodRef.child('door_state').set(status);
  }

  void _setSpot(bool open) {
    int status = open ? 1 : 3;
    widget.lockerPodRef.child('spot_state').set(status);
  }

  String getDoorText() {
    if (doorStatus == 1) {
      return 'Door: Opening';
    } else if (doorStatus == 3) {
      return 'Door: Closing';
    } else if (doorStatus == 0) {
      return 'Door: Closed';
    } else {
      return 'Door: Open';
    }
  }

  String getSpotText() {
    if (spotStatus == 1) {
      return 'Spot: Opening';
    } else if (spotStatus == 3) {
      return 'Spot: Closing';
    } else if (spotStatus == 0) {
      return 'Spot: Closed';
    } else {
      return 'Spot: Open';
    }
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
              'Remote Actions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),

            // Mode
            _roundedBox(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    manualOverride ? 'Mode: Manual' : 'Mode: Auto',
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(width: 12),
                  Switch(
                    value: manualOverride,
                    activeColor: Colors.orange,
                    onChanged: _setOverride,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Light
            _roundedBox(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    manualToggle ? 'Light: On' : 'Light: Off',
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(width: 12),
                  Switch(
                    value: manualToggle,
                    activeColor: Colors.green,
                    onChanged: manualOverride ? _setToggle : null,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Door
            _roundedBox(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    getDoorText(),
                    style: TextStyle(
                        fontSize: 16,
                        color: isProcessingDoor
                            ? Colors.yellow[700]
                            : doorStatus == 2
                                ? Colors.red
                                : Colors.black),
                  ),
                  const SizedBox(width: 12),
                  Switch(
                    value: doorStatus == 2,
                    activeColor: Colors.red,
                    onChanged: isProcessingDoor ? null : (v) => _setDoor(v),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Spot
            _roundedBox(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    getSpotText(),
                    style: TextStyle(
                        fontSize: 16,
                        color: isProcessingSpot
                            ? Colors.yellow[700]
                            : spotStatus == 2
                                ? Colors.red
                                : Colors.black),
                  ),
                  const SizedBox(width: 12),
                  Switch(
                    value: spotStatus == 2,
                    activeColor: Colors.red,
                    onChanged: isProcessingSpot ? null : (v) => _setSpot(v),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _roundedBox({required Widget child}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }
}
