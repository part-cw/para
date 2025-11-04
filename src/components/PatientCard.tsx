import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';

// TODO - use format age function for age info
// TODO - fix risk profile mapping
// TODO - add functionality to buttons
// TODO - add status mapping? 

type PatientCardProps = {
  id: string;
  name: string;
  age?: string;
  status: string;
  riskLevel?: 'low' | 'moderate' | 'high' | 'very high' | string;
  riskProfile?: string[];
  recommendedCareplan?: string[];
  isDischarged: boolean;
  isDraft: boolean;
  admittedAt?: string;
};

export default function PatientCard({ 
  id,
  name,
  age,
  status,
  riskLevel,
  riskProfile,
  recommendedCareplan,
  isDischarged,
  isDraft,
  admittedAt
}: PatientCardProps) {
  const { colors } = useTheme();  
  const [expanded, setExpanded] = useState(false);

  let riskColor;
  if (riskLevel) {
    riskColor = {
      low: '#4caf50',
      moderate: '#rgb(255, 208, 0)',
      high: '#ff9800',
      'very high': '#f44336',
    }[riskLevel];
  }
  

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
                <Text style={styles.name}>{name} </Text>
                {isDraft 
                ?
                <Text style={[styles.info, {fontStyle: 'italic', color: 'grey'}]}>(in progress - started {admittedAt})</Text>
                :
                <Text style={[styles.info, {fontStyle: 'italic', color: 'grey'}]}>({status})</Text>
                }
                
            </View>
            
            <View style={{flexDirection: 'row'}}>
                <Text style={[styles.info, {fontWeight: 'bold'}]}>ID: </Text><Text style={styles.info}>{id}</Text> 
            </View>
            {age &&
              <View style={{flexDirection: 'row'}}>
                  <Text style={[styles.info, {fontWeight: 'bold'}]}>Age: </Text>
                  <Text style={styles.info}>{age}</Text>
              </View>
            }
          </View>
          <MaterialIcons
            name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={28}
            color={colors.primary}
          />
        </View>

        {/* Risk level */}
        {riskLevel &&
        <View style={styles.riskRow}>
          <Text style={styles.label}>Risk Level: </Text>
          <View style={[styles.badge, { backgroundColor: riskColor }]}>
            <Text style={styles.badgeText}>{riskLevel.toUpperCase()}</Text>
          </View>
        </View>
        }
      </TouchableOpacity>

      {/* Expanded section */}
      {expanded && (
        <View style={styles.expandedSection}>
          {/* Show Risk Profile if available */}
          {riskProfile && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Risk Profile: </Text>
              <View style={styles.grayBadge}>
                <Text style={styles.grayBadgeText}>
                  {riskProfile.length === 0 ? 'Generic': 'TODO map conditions'}
                </Text>
              </View>
            </View>
          )}

          {/* Recommended careplan (only for non-discharged) */}
          {isDischarged && recommendedCareplan && (
            <>
              <Text style={[styles.subheading]}>Recommended Careplan</Text>
              {recommendedCareplan.map((video, index) => (
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
          {isDraft 
            ? 
            (<View style={styles.footerButtons}>
              <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons
                    name="arrow-forward"
                    size={24}
                    color={colors.onSecondary}
                />
                <Text style={styles.buttonText}>Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons
                    name="delete"
                    size={24}
                    color={colors.onSecondary}
                />
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>

            </View>)
            : 
            (<View style={styles.footerButtons}>
              <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons
                    name="edit"
                    size={24}
                    color={colors.onSecondary}
                />
                <Text style={styles.buttonText}>View/Edit</Text>
              </TouchableOpacity>

              {isDischarged ? (
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
            </View>)
          }
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
    paddingVertical: 3,
    paddingHorizontal: 3,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    width: 65,
    height: 55
  },
  buttonText: {
    fontSize: 12,
    marginTop: 4,
  },
});
