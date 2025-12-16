// lib/main.dart

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';

import 'side_menu.dart';
import 'top_bar.dart';
import 'pod_header.dart';
import 'pod_content.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: "AIzaSyBydwUR2hcQgpyMbcCTiRH86gWZaDKKXR4",
      authDomain: "booking-ee47f.firebaseapp.com",
      databaseURL:
          "https://booking-ee47f-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "booking-ee47f",
      storageBucket: "booking-ee47f.firebasestorage.app",
      messagingSenderId: "297718966154",
      appId: "1:297718966154:web:b2c07b0d9a1fdfb6f8ca73",
    ),
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: DashboardPage(),
    );
  }
}

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    // Main pod for light
    final DatabaseReference basePodRef =
        FirebaseDatabase.instance.ref('devices/Pod_01_base_01');

    // Entrance pod for door/spot
    final DatabaseReference entradaPodRef =
        FirebaseDatabase.instance.ref('devices/Pod_01_entrada_01');

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: LayoutBuilder(
        builder: (context, constraints) {
          bool smallScreen = constraints.maxWidth <= 800;

          return Row(
            children: [
              SideMenu(collapsed: smallScreen),
              Expanded(
                child: Column(
                  children: [
                    TopBar(smallScreen: smallScreen),
                    PodHeader(podRef: basePodRef),
                    Expanded(
                      child: SingleChildScrollView(
                        child: PodContent(
                          lightPodRef: basePodRef,
                          lockerPodRef: entradaPodRef,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
