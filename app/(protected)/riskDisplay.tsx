import CaregiverVideosModal from '@/src/components/CaregiverVideosModal';
import ChangeRiskLevelModal from '@/src/components/ChangeRiskLevelModal';
import RiskCard from '@/src/components/RiskCard';
import RiskLevelInterpretationModal from '@/src/components/RiskLevelInterpretationModal';
import { useAuth } from '@/src/contexts/AuthContext';
import { CategorizedMedicalConditions } from '@/src/contexts/CategorizedMedicalConditions';
import { useStorage } from '@/src/contexts/StorageContext';
import { RiskAssessment, RiskPrediction } from '@/src/models/types';
import { GlobalStyles as Styles } from '@/src/themes/styles';
import { getVideosForConditions } from '@/src/utils/careContentLoader';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, useTheme } from 'react-native-paper';


export default function RiskDisplay() {
  const { colors } = useTheme();
  const { storage } = useStorage();
  const { currentUser } = useAuth();
  const [isConditionsExpanded, setIsConditionsExpanded] = useState<boolean>(false);
  const [showInterpretationModal, setShowInterpretationModal] = useState<boolean>(false);
  const [showChangeRiskModal, setShowChangeRiskModal] = useState<boolean>(false);
  const [showVideosModal, setShowVideosModal] = useState<boolean>(false);

  const userId = currentUser?.displayName || currentUser?.username || 'unknown';

  const params = useLocalSearchParams();

  // parse params
  const patientId = params.patientId as string;
  const patientName = params.patientName as string;
  const riskAssessment: RiskAssessment | null = params.riskAssessment ? JSON.parse(params.riskAssessment as string) : null;
  const medicalConditions: CategorizedMedicalConditions | null = params.medicalConditions ? JSON.parse(params.medicalConditions as string) : null;

  const discharge = riskAssessment?.discharge;
  const usageTime: 'admission' | 'discharge' = discharge ? 'discharge' : 'admission';

  // The patient's current prediction (discharge if present, else admission). Starts from the loaded
  // assessment, then is replaced with the updated prediction returned by an elevate/undo on this screen.
  const [activePred, setActivePred] = useState<RiskPrediction | null>(discharge ?? riskAssessment?.admission ?? null);

  // Handle missing data
  if (!riskAssessment || !patientId || !patientName) {
    return (
      <View style={{flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 20}}>
        <MaterialIcons name="error-outline" size={64} color={colors.error} />
        <Text style={{fontSize: 18, marginTop: 16, textAlign: 'center'}}>
          No risk assessment data available
        </Text>
        <Text style={{fontSize: 14, marginTop: 16, textAlign: 'center'}}>
          Please make sure all clinical variable are entered
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.back()}
          style={{marginTop: 20}}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const riskScore = activePred?.riskScore;
  const riskCategory = activePred?.riskCategory;
  const isElevated = !!activePred?.isManuallyElevated;
  const originalCategory = activePred?.originalRiskCategory;

  const handleElevateRiskCategory = async (newLevel: string | null) => {
    if (newLevel) {
      const updated = await storage.elevateRiskCategory(patientId, usageTime, newLevel, userId);
      setActivePred(updated);
    }
    setShowChangeRiskModal(false);
  };

  const handleUndoRiskElevation = async () => {
    const updated = await storage.undoRiskElevation(patientId, usageTime, userId);
    setActivePred(updated);
    setShowInterpretationModal(false);
  };

  // Get top 3 conditions to display with guaranteed critical conditions
  const getTopConditions = (): { display: string[];  remaining: string[]; hasMore: boolean; hiddenCount: number } => {
    if (!medicalConditions || (medicalConditions.positive.length === 0 && medicalConditions.suspected.length === 0)) {
      return { display: [], remaining: [], hasMore: false, hiddenCount: 0 };
    }
    
    // Critical conditions that MUST always be shown if present
    const criticalConditions = [
      'Sick Young Infant',
      'Severe Acute Malnutrition (SAM)',
      'Severe Anaemia'
    ];

    // Separate conditions into critical and other
    const critical: string[] = [];
    const other: string[] = [];

    // Process positive conditions
    medicalConditions.positive.forEach(condition => {
      if (criticalConditions.includes(condition)) {
        critical.push(condition);
      } else {
        other.push(condition);
      }
    });

    // Process suspected conditions
    medicalConditions.suspected.forEach(condition => {
      if (criticalConditions.includes(condition)) {
        critical.push(`${condition} (suspected)`);
      } else {
        other.push(`${condition} (suspected)`);
      }
    });
    
    // Build display list: critical conditions first, then fill remaining slots
    const displayList: string[] = [...critical];
    const remainingSlots = 3 - critical.length;
    
    if (remainingSlots > 0) {
      displayList.push(...other.slice(0, remainingSlots));
    }

    const remainingConditions = other.slice(remainingSlots > 0 ? remainingSlots : 0);
    const totalConditions = critical.length + other.length;
    const hiddenCount = totalConditions - displayList.length;
    
    return {
      display: displayList,
      remaining: remainingConditions,
      hasMore: hiddenCount > 0,
      hiddenCount
    };
  };

  // Get count of all conditions for display
  const getTotalConditionsCount = (): number => {
    if (!medicalConditions) return 0;
    return medicalConditions.positive.length + medicalConditions.suspected.length;
  };

  const conditionsData = getTopConditions();

  // Caregiver education videos matched to this patient's conditions (available from admission on).
  const videos = getVideosForConditions(medicalConditions);

  return (
    <>
    {riskAssessment 
      ? 
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <ScrollView contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 0}}>
          {/* Header */}
          <View style={[Styles.pageHeaderContainer]}>
            <Text style={[Styles.pageHeaderTitle ]}>
                Mortality Risk Prediction 
            </Text>
          </View>

          <View style={{padding: 20}}>
            <View style={{margin: 10, flexDirection: 'row',  flexWrap: 'wrap'}}>
              <Text style={{fontSize: 16, fontWeight: 'bold', flexShrink: 1}}>
                Calculated risk level at {!discharge ? 'admission' : 'discharge'} time for{' '}
              </Text>
              <Text style={{fontSize: 16, fontWeight: 'bold', flexShrink: 1,  color: colors.primary}}>
                {patientName}:
              </Text> 
            </View>

              <RiskCard
                title={riskCategory?.toUpperCase()}
                variant={riskCategory?.toLowerCase()}
                isElevated={isElevated}
                content={
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    {isElevated &&
                      <Text style={{ fontSize: 13, fontStyle: 'italic', color: '#d32f2f' }}>
                        Originally: {originalCategory?.toUpperCase()}
                      </Text>
                    }
                    <Text style={{ fontSize: 16, lineHeight: 20, marginBottom: 4 }}>
                      Risk score = {riskScore}%
                    </Text>
                  </View>
                }
                containerStyle={{alignItems: 'center'}}
                expandable={true}
              >
                {/* TODO - replace placeholder predictors once top-predictor selection is decided */}
                <View style={{ alignSelf: 'stretch' }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 }}>
                    TOP PREDICTORS
                  </Text>
                  {['Variable 1', 'Variable 2', 'Variable 3'].map((variable, index) => (
                    <Text key={`predictor-${index}`} style={{ fontSize: 15, marginBottom: 6 }}>
                      • {variable}
                    </Text>
                  ))}
                </View>
                <Button
                  style={{ alignSelf: 'center', marginTop: 20 }}
                  mode="elevated"
                  buttonColor={colors.tertiary}
                  textColor={colors.onTertiary}
                  onPress={() => setShowInterpretationModal(true)}
                >
                  More Info
                </Button>
              </RiskCard>
            
            <Text style={{fontSize: 16, fontWeight: 'bold', margin: 10}}>{!discharge ? 'Admission Targeted Medical Conditions' : 'Discharge Targeted Medical Conditions'}</Text>
            
            {/* TODO - map conditions to interventions */}
            <RiskCard
                title={getTotalConditionsCount() > 0 ? 'Relevant Morbidities' : 'No Conditions Recorded'}
                expandable={conditionsData.hasMore} // expands if more than 3 conditions
                onExpandChange={setIsConditionsExpanded}
                content={
                  conditionsData.display.length === 0 ? (
                    'No conditions recorded'
                  ) : (
                    <View style={{ marginTop: 4, marginBottom: 8 }}>
                      {conditionsData.display.map((condition, index) => (
                        <View 
                          key={`display-${index}`}
                          style={{ 
                            alignItems: 'flex-start',
                            flexDirection: 'row',
                            marginBottom: 6
                          }}
                        >
                          <MaterialIcons 
                            name="check-circle" 
                            size={12} 
                            color={colors.primary}
                            style={{ marginRight: 8, marginTop: 5 }}
                          />
                          <Text style={{ fontSize: 16, lineHeight: 22 }}>
                            {condition}
                          </Text>
                        </View>
                      ))}
                      
                      {/* Show count of additional conditions */}
                      {!isConditionsExpanded && conditionsData.hasMore && (
                        // <TouchableOpacity onPress={() => setIsConditionsExpanded(true)}>
                          <Text style={{ 
                            fontSize: 14, 
                            fontStyle: 'italic', 
                            color: '#666',
                            marginTop: 4,
                            marginLeft: 20
                          }}>
                            +{conditionsData.hiddenCount} more condition{conditionsData.hiddenCount > 1 ? 's' : ''}
                          </Text>
                        // </TouchableOpacity>
                      )}
                    </View>
                  )
              }
            >
              {/* Show remaining conditions when expanded */}
              {conditionsData.remaining.length > 0 && (
                <View style={{ marginTop: -15, marginBottom: 8}}>
                  {conditionsData.remaining.map((condition, index) => (
                    <View 
                      key={`remaining-${index}`}
                      style={{ 
                        alignItems: 'flex-start',
                        flexDirection: 'row',
                        marginBottom: 6
                      }}
                    >
                      <MaterialIcons 
                        name="check-circle" 
                        size={12} 
                        color={colors.primary}
                        style={{ marginRight: 8, marginTop: 5 }}
                      />
                      <Text style={{ fontSize: 16, lineHeight: 22 }}>
                        {condition}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

            </RiskCard>

            {/* Caregiver education videos matched to this patient's conditions */}
            {videos.length > 0 && (
              <Button
                style={{ alignSelf: 'center', marginTop: 8 }}
                mode="elevated"
                icon="play-circle-outline"
                buttonColor={colors.tertiary}
                textColor={colors.onTertiary}
                onPress={() => setShowVideosModal(true)}
              >
                Watch Caregiver Videos
              </Button>
            )}

            {/* Care plan is only offered after discharge; admission keeps the records button. */}
            {discharge ? (
              <Button
                style={{ alignSelf: 'center', marginTop: 20 }}
                mode="elevated"
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={() => router.push({
                  pathname: '/carePlan',
                  params: {
                    patientId,
                    patientName,
                    medicalConditions: JSON.stringify(medicalConditions),
                  },
                })}
              >
                Next
              </Button>
            ) : (
              <Button
                style={{ alignSelf: 'center', marginTop: 20 }}
                mode="elevated"
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                onPress={() => router.replace('/patientRecords')}
              >
                Patient Records
              </Button>
            )}
          </View>
        </ScrollView>

        <RiskLevelInterpretationModal
          showModal={showInterpretationModal}
          riskCategory={riskCategory}
          isElevated={isElevated}
          originalRiskCategory={originalCategory}
          onRequestClose={() => setShowInterpretationModal(false)}
          // Just going to below modal (via Elevate Risk Level button), not yet elevating risk category
          onElevate={() => {
            setShowInterpretationModal(false);
            setShowChangeRiskModal(true);
          }}
          onUndo={handleUndoRiskElevation}
        />

        <ChangeRiskLevelModal
          showModal={showChangeRiskModal}
          currentRiskCategory={riskCategory}
          onRequestClose={() => setShowChangeRiskModal(false)}
          onSave={handleElevateRiskCategory}
        />

        <CaregiverVideosModal
          visible={showVideosModal}
          videos={videos}
          onRequestClose={() => setShowVideosModal(false)}
        />
      </View>
      :
      null
    }
    </>
  );
}