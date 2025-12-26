import React, { ReactElement } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ScoringResult } from '@/types/scoring';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '1 solid #e2e8f0', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e40af' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1e293b' },
  focusArea: { marginBottom: 15, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 },
  rankBadge: { fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  focusAreaTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 3 },
  focusAreaDetail: { fontSize: 10, color: '#475569', marginTop: 2 },
  contribution: { fontSize: 9, color: '#64748b', marginLeft: 10, marginTop: 2 },
  badge: { fontSize: 9, padding: '2 6', borderRadius: 3 },
  highBadge: { backgroundColor: '#fecaca', color: '#991b1b' },
  mediumBadge: { backgroundColor: '#fef3c7', color: '#92400e' },
  lowBadge: { backgroundColor: '#d1fae5', color: '#065f46' },
  disclaimer: { marginTop: 30, padding: 10, backgroundColor: '#fefce8', fontSize: 9, color: '#713f12' },
  confidenceFactor: { fontSize: 10, marginTop: 2 },
});

interface ReportDocumentProps {
  data: ScoringResult;
  serviceName?: string;
}

export function ReportDocument({ data, serviceName }: ReportDocumentProps): ReactElement {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>A&R Focus Forecast Report</Text>
          {serviceName && (
            <Text style={styles.subtitle}>Service: {serviceName}</Text>
          )}
          <Text style={styles.subtitle}>
            Generated: {new Date(data.timestamp).toLocaleDateString('en-AU')}
          </Text>
          <Text style={styles.subtitle}>Model Version: {data.modelVersion}</Text>
        </View>

        {/* Confidence Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Confidence Score: {Math.round(data.confidenceScore)}/100
          </Text>
          {data.confidenceFactors.map((factor, i) => (
            <Text key={i} style={styles.confidenceFactor}>
              • {factor.factor}: {Math.round(factor.value)}% ({factor.impact})
            </Text>
          ))}
        </View>

        {/* Focus Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ranked Focus Areas</Text>
          {data.rankedFocusAreas.map((area) => (
            <View key={area.rank} style={styles.focusArea}>
              <Text style={styles.rankBadge}>
                #{area.rank} - {area.probability} Probability
              </Text>
              <Text style={styles.focusAreaTitle}>
                {area.dimension.code} - {area.dimension.name}
              </Text>
              <Text style={styles.focusAreaDetail}>
                Score: {Math.round(area.dimension.normalizedScore)}/100
              </Text>
              <Text style={styles.focusAreaDetail}>
                Suggested Prep Time: {area.prepTimeAllocation}%
              </Text>
              
              <Text style={{ ...styles.focusAreaDetail, marginTop: 5, fontWeight: 'bold' }}>
                Key Contributors:
              </Text>
              {area.dimension.contributions.slice(0, 3).map((c, i) => (
                <Text key={i} style={styles.contribution}>
                  • {c.explanation} ({c.delta > 0 ? '+' : ''}{c.delta} points)
                </Text>
              ))}

              {area.likelyQuestions.length > 0 && (
                <>
                  <Text style={{ ...styles.focusAreaDetail, marginTop: 5, fontWeight: 'bold' }}>
                    Likely Questions:
                  </Text>
                  {area.likelyQuestions.slice(0, 3).map((q, i) => (
                    <Text key={i} style={styles.contribution}>
                      • {q}
                    </Text>
                  ))}
                </>
              )}

              {area.redFlags.length > 0 && (
                <>
                  <Text style={{ ...styles.focusAreaDetail, marginTop: 5, fontWeight: 'bold', color: '#dc2626' }}>
                    Red Flags:
                  </Text>
                  {area.redFlags.map((flag, i) => (
                    <Text key={i} style={{ ...styles.contribution, color: '#dc2626' }}>
                      {flag}
                    </Text>
                  ))}
                </>
              )}
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Important Disclaimer</Text>
          <Text>
            This report provides a probability-based forecast only. It does not guarantee 
            what an Authorised Officer will focus on during an Assessment and Rating visit. 
            Results are based on the responses provided and should be used as a preparation 
            guide only. Always refer to the National Quality Framework and your regulatory 
            authority for authoritative guidance.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
