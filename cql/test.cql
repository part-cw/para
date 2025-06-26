library TEST_Model version '1.0.0'

// other import statements (eg. FHIR)

/*
* Do MUAC and WAZ calculation in frontend, then pass calculated scores to CQL engine as FHIR Observation?
*           (easier - same calculation for all models)
*/


// Compute risk level
define "ScaledScore":
    1 / (1 + Exp(-2))


// Risk category
define "HighRisk":
  "ScaledScore" >= 0.2


// Question: can we simply import threshold and coefficients from model JSON instead of hardcoding here?


