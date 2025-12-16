// lib/side_menu.dart

import 'package:flutter/material.dart';

class SideMenu extends StatelessWidget {
  final bool collapsed;

  const SideMenu({super.key, this.collapsed = false});

  @override
  Widget build(BuildContext context) {
    double width = collapsed ? 70 : 250;
    double paddingSize = collapsed ? 8.0 : 20.0;

    return Container(
      width: width,
      color: const Color(0xFFF9F9F9),
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(paddingSize),
            child: Row(
              children: [
                const Icon(
                  Icons.circle_outlined,
                  size: 40,
                  color: Colors.black,
                ),
                if (!collapsed) ...[
                  const SizedBox(width: 12),
                  const Text(
                    'BiclaNet',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          _menuItem(
              icon: Icons.dashboard,
              title: 'Dashboard',
              selected: true,
              collapsed: collapsed),
          _menuItem(
              icon: Icons.build, title: 'Pod Builder', collapsed: collapsed),
          _menuItem(
              icon: Icons.apps, title: 'App Builder', collapsed: collapsed),
          _menuItem(
              icon: Icons.people,
              title: 'Team & Account',
              collapsed: collapsed),
          const Divider(height: 1),
          _menuItem(
              icon: Icons.help_outline,
              title: 'FAQ / Hardware Docs',
              collapsed: collapsed),
        ],
      ),
    );
  }

  Widget _menuItem({
    required IconData icon,
    required String title,
    required bool collapsed,
    bool selected = false,
  }) {
    return Container(
      color: selected ? Colors.grey[300] : Colors.transparent,
      child: ListTile(
        leading: Icon(
          icon,
          color: selected ? Colors.black : Colors.grey[600],
        ),
        title: collapsed
            ? null
            : Text(
                title,
                style: TextStyle(
                  color: selected ? Colors.black : Colors.grey[700],
                  fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
      ),
    );
  }
}
