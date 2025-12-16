// lib/dev01_sensor_light.dart

import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

class Dev01SensorLight extends StatefulWidget {
  final DatabaseReference podRef;

  const Dev01SensorLight({super.key, required this.podRef});

  @override
  State<Dev01SensorLight> createState() => _Dev01SensorLightState();
}

class _Dev01SensorLightState extends State<Dev01SensorLight> {
  Map<String, int> sensorValues = {
    'sensor0': 0,
    'sensor1': 0,
    'sensor2': 0,
    'sensor3': 0
  };
  Map<String, double> sensorWeights = {
    'sensor0': 1.0,
    'sensor1': 1.0,
    'sensor2': 1.0,
    'sensor3': 1.0
  };

  @override
  void initState() {
    super.initState();
    widget.podRef.child('sensors_data').onValue.listen((event) {
      final data = event.snapshot.value as Map<Object?, Object?>?;
      if (data == null) return;
      setState(() {
        sensorValues['sensor0'] = data['sensor0'] as int? ?? 0;
        sensorValues['sensor1'] = data['sensor1'] as int? ?? 0;
        sensorValues['sensor2'] = data['sensor2'] as int? ?? 0;
        sensorValues['sensor3'] = data['sensor3'] as int? ?? 0;
      });
    });
    widget.podRef.child('sensor_weights').onValue.listen((event) {
      final data = event.snapshot.value as Map<Object?, Object?>?;
      if (data == null) return;
      setState(() {
        sensorWeights['sensor0'] = (data['sensor0'] as num?)?.toDouble() ?? 1.0;
        sensorWeights['sensor1'] = (data['sensor1'] as num?)?.toDouble() ?? 1.0;
        sensorWeights['sensor2'] = (data['sensor2'] as num?)?.toDouble() ?? 1.0;
        sensorWeights['sensor3'] = (data['sensor3'] as num?)?.toDouble() ?? 1.0;
      });
    });
  }

  void _updateWeight(String sensor, double percent) {
    double normalized = percent / 100.0;
    widget.podRef.child('sensor_weights/$sensor').set(normalized);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Selected Slot Status',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _circle('SL1'),
                _circle('SL2'),
                _circle('SL3'),
                _circle('SL4'),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Text(sensorValues['sensor0']!.toString()),
                Text(sensorValues['sensor1']!.toString()),
                Text(sensorValues['sensor2']!.toString()),
                Text(sensorValues['sensor3']!.toString()),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _slider('sensor0', sensorWeights['sensor0']! * 100),
                _slider('sensor1', sensorWeights['sensor1']! * 100),
                _slider('sensor2', sensorWeights['sensor2']! * 100),
                _slider('sensor3', sensorWeights['sensor3']! * 100),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _circle(String text) {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.green[400],
        shape: BoxShape.circle,
      ),
      child: Center(
          child: Text(text,
              style: const TextStyle(color: Colors.white, fontSize: 16))),
    );
  }

  Widget _slider(String sensor, double percent) {
    return Expanded(
      child: Column(
        children: [
          Text('${percent.round()}%'),
          Slider(
            min: 0.0,
            max: 100.0,
            value: percent,
            onChanged: (newValue) {
              setState(() {
                sensorWeights[sensor] = newValue / 100.0;
              });
              _updateWeight(sensor, newValue);
            },
          ),
        ],
      ),
    );
  }
}
