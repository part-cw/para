import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';

// TODO - fix risk profile mapping

type PatientCardProps = {
  id: string;
  name: string;
  age?: string;
  status: string;
  riskCategory?: string;
  riskProfile?: string[];
  recommendedCareplan?: string[];
  isDischarged: boolean;
  isDraft: boolean;
  admittedAt?: string | null;
  onResume?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDischarge?: () => Promise<void> | void;
  onArchive?: () => Promise<void> | void;
};

export default function PatientCard({ 
  id,
  name,
  age,
  status,
  riskCategory,
  riskProfile,
  recommendedCareplan,
  isDischarged,
  isDraft,
  admittedAt,
  onResume,
  onDelete,
  onEdit,
  onDischarge,
  onArchive
}: PatientCardProps) {
  const { colors } = useTheme();  
  const [expanded, setExpanded] = useState(false);

  let riskColor;
  if (riskCategory) {
    riskColor = {
      low: '#4caf50',
      moderate: '#rgb(255, 208, 0)',
      high: '#ff9800',
      'very high': '#f44336',
      none: 'grey'
    }[riskCategory];
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
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <View style={styles.statusContainer}>
            <MaterialIcons 
              name="circle" 
              size={8} 
              color={
                status.toLowerCase() === 'active'
                  ? '#4caf50' // green #4caf50
                  : status.toLowerCase() === 'discharged'
                  ? '#bdbdbd' // #bdbdbd
                  : status.toLowerCase() === 'deceased'
                  ? 'rgb(237, 78, 78)' // rgb(237, 78, 78)
                  : 'rgba(251, 234, 0, 0.98)' // draft/default  
              }
              style={{marginRight: 5}}
            />
            <Text style={[styles.info, {color: 'grey', marginRight: 5}]}>
              {status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={{flexDirection: 'row'}}>
            <Text style={[styles.info, {fontWeight: 'bold'}]}>ID: </Text>
            <Text style={styles.info}>{id}</Text> 
        </View>

        {(age !== undefined && age !== null && age !== '') &&
          <View style={{flexDirection: 'row'}}>
              <Text style={[styles.info, {fontWeight: 'bold'}]}>Age: </Text>
              <Text style={styles.info}>{age}</Text>
          </View>
        }
        {isDraft &&
          <Text style={[styles.info, {fontStyle: 'italic', color: 'grey'}]}>Started at {admittedAt}</Text>
        }

        {/* Risk level + arrow */}
        {riskCategory &&
        <View style={styles.riskRow}>
          <Text style={styles.label}>Risk Level: </Text>
          <View style={[styles.badge, { backgroundColor: riskColor }]}>
            <Text style={styles.badgeText}>{riskCategory.toUpperCase()}</Text>
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
              <TouchableOpacity style={styles.iconButton} onPress={() => onResume?.()}>
                <MaterialIcons
                    name="arrow-forward"
                    size={24}
                    color={colors.onSecondary}
                />
                <Text style={styles.buttonText}>Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.iconButton, styles.rightFooterButton]} onPress={() => onDelete?.()}>
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
              <TouchableOpacity style={styles.iconButton} onPress={() => onEdit?.()}>
                <MaterialIcons
                    name="edit"
                    size={24}
                    color={colors.onSecondary}
                />
                <Text style={styles.buttonText}>View/Edit</Text>
              </TouchableOpacity>

              {isDischarged ? (
                <TouchableOpacity style={[styles.iconButton, styles.rightFooterButton]} onPress={() => onArchive?.()}>
                    <MaterialIcons
                    name="archive"
                    size={24}
                    color={colors.onSecondary}
                    />
                    <Text style={styles.buttonText}>Archive</Text>
                </TouchableOpacity>
                ) : (
                <TouchableOpacity style={[styles.iconButton, styles.rightFooterButton]} onPress={() => onDischarge?.()}>
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

      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.arrowButton}>
        <MaterialIcons
          name={expanded ? 'keyboard-double-arrow-up' : 'keyboard-double-arrow-down'}
          size={28}
          color={colors.primary}
        />
      </TouchableOpacity>
   
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
    flexWrap: 'wrap',
    flexShrink: 1,
    flexGrow: 1,
    marginRight: 8,
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
    justifyContent: 'space-evenly',  // TODO
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  statusContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexShrink: 0
  },
  arrowButton: {
    position: 'absolute',
    bottom: 16,
    right: 16
  },
  rightFooterButton: {
    marginRight: 40
  }
});
