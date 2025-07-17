import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';


interface Props {
  title: string;
}

export default function AddChildHeader({ title }: Props) {
    const {colors, fonts} = useTheme();

    return (
        <View style={[styles.wrapper]}>
            <View style={[styles.container, { backgroundColor: colors.primaryContainer }]}>
                <Pressable onPress={() => {
                    console.log('burger menu pressed') // TODO - delete
                    }}>
                    <MaterialIcons name="menu" size={28} color={colors.tertiary} />
                </Pressable>
                <Text style={[styles.title, fonts.titleLarge, { color: colors.onPrimaryContainer }]}>
                    {title}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    // zIndex: 99, // TODO: delete?
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});