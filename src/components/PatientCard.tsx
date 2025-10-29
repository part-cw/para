import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';

// TODO - use format age function for age info
// TODO - fix risk profile mapping
// TODO - add functionality to buttons

export type PatientCardType = {
  id: string;
  name: string;
  age: string;
  status: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'very high' ;
  riskProfile?: string[];
  recommendedCareplan?: string[];
  isDischarged: boolean;
};

type Props = {
  patient: PatientCardType;
};

export default function PatientCard({ patient }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const riskColor = {
    low: '#4caf50',
    moderate: '#rgb(255, 208, 0)',
    high: '#ff9800',
    'very high': '#f44336',
  }[patient.riskLevel];

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: expanded ? colors.secondary : 'white' },
      ]}
    >
      {/* Top summary row */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerRow}>
          <View>
            <View style={{flexDirection: 'row'}}>
                <Text style={styles.name}>{patient.name} </Text>
                <Text style={[styles.info, {fontStyle: 'italic', color: 'grey'}]}>({patient.status})</Text>
            </View>
            
            <View style={{flexDirection: 'row'}}>
                <Text style={[styles.info, {fontWeight: 'bold'}]}>ID: </Text><Text style={styles.info}>{patient.id}</Text> 
            </View>
            <View style={{flexDirection: 'row'}}>
                <Text style={[styles.info, {fontWeight: 'bold'}]}>Age: </Text>
                <Text style={styles.info}>{patient.age}</Text>
            </View>
          </View>
          <MaterialIcons
            name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={28}
            color={colors.primary}
          />
        </View>

        {/* Risk level */}
        <View style={styles.riskRow}>
          <Text style={styles.label}>Risk Level: </Text>
          <View style={[styles.badge, { backgroundColor: riskColor }]}>
            <Text style={styles.badgeText}>{patient.riskLevel.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded section */}
      {expanded && (
        <View style={styles.expandedSection}>
          {/* Show Risk Profile if available */}
          {patient.riskProfile && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Risk Profile: </Text>
              <View style={styles.grayBadge}>
                <Text style={styles.grayBadgeText}>
                  {patient.riskProfile.length === 0 ? 'Generic': 'TODO map conditions'}
                </Text>
              </View>
            </View>
          )}

          {/* Recommended careplan (only for non-discharged) */}
          {!patient.isDischarged && patient.recommendedCareplan && (
            <>
              <Text style={[styles.subheading]}>Recommended Careplan</Text>
              {patient.recommendedCareplan.map((video, index) => (
                <View key={index} style={styles.careplanRow}>
                  <MaterialIcons
                    name="play-circle-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <Text style={styles.careplanText}>{video}</Text>
                </View>
              ))}
            </>
          )}

          {/* Footer buttons (change if discharged) */}
            <View style={styles.footerButtons}>
                <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons
                    name="edit"
                    size={24}
                    color={colors.onSecondary}
                />
                <Text style={styles.buttonText}>View/Edit</Text>
                </TouchableOpacity>

                {patient.isDischarged ? (
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons
                    name="archive"
                    size={24}
                    color={colors.onSecondary}
                    />
                    <Text style={styles.buttonText}>Archive</Text>
                </TouchableOpacity>
                ) : (
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons
                    name="directions-walk"
                    size={24}
                    color={colors.onSecondary}
                    />
                    <Text style={styles.buttonText}>Discharge</Text>
                </TouchableOpacity>
                )}
            </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  info: {
    fontSize: 14,
    marginTop: 2,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  expandedSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  grayBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  grayBadgeText: {
    color: '#333',
  },
  subheading: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 4,
  },
  careplanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  careplanText: {
    fontSize: 14,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  iconButton: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    marginTop: 4,
  },
});
