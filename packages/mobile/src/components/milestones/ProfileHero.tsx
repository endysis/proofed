import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import type { LevelDefinition } from '../../constants/milestones';
import GemStone from './GemStone';
import Modal from '../common/Modal';

interface Props {
  currentLevel: LevelDefinition;
  totalNibs: number;
  nibsToNextLevel: number | null;
  levelProgress: number;
}

export default function ProfileHero({
  currentLevel,
  totalNibs,
  nibsToNextLevel,
  levelProgress,
}: Props) {
  const [showClassModal, setShowClassModal] = useState(false);
  const gemColor = currentLevel.color;
  const romanNumerals = ['I', 'II', 'III', 'IV'];

  return (
    <View style={styles.container}>
      {/* Gemstone */}
      <TouchableOpacity style={styles.gemWrapper} onPress={() => setShowClassModal(true)} activeOpacity={0.7}>
        <GemStone color={gemColor} size={64}  />
      </TouchableOpacity>

      {/* Stone name */}
      <Text style={[styles.title, { color: gemColor }]}>
        {currentLevel.title}
      </Text>

      {/* Degree pipes */}
      <View style={styles.degreePipes}>
        {Array.from({ length: currentLevel.degree }).map((_, i) => (
          <View key={i} style={[styles.pipe, { backgroundColor: gemColor }]} />
        ))}
      </View>

      {/* Nibs info */}
      <Text style={styles.nibsText}>
        {totalNibs} nibs
      </Text>

      {/* Progress to next level */}
      {nibsToNextLevel != null ? (
        <>
          <View style={styles.progressBarOuter}>
            <View
              style={[styles.progressBarInner, { width: `${Math.round(levelProgress * 100)}%`, backgroundColor: gemColor }]}
            />
          </View>
          <Text style={styles.nextLevelText}>
            {nibsToNextLevel} nibs to the next {currentLevel.degree === 4 ? 'class' : 'degree'}
          </Text>
        </>
      ) : (
        <Text style={styles.nextLevelText}>Max level reached!</Text>
      )}

      <Modal isOpen={showClassModal} onClose={() => setShowClassModal(false)} title="Baker Class">
        <View style={styles.modalContent}>
          <GemStone color={gemColor} size={96}  />
          <Text style={[styles.classLabel, { color: gemColor }]}>
            {currentLevel.title} — Degree {romanNumerals[currentLevel.degree - 1]}
          </Text>
          <View style={styles.requiredSection}>
            <Text style={styles.requiredTitle}>Required</Text>
            <Text style={styles.requiredValue}>{currentLevel.nibsRequired} nibs to achieve</Text>
          </View>
          <Text style={styles.currentNibs}>Current total: {totalNibs} nibs</Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing[1],
  },
  degreePipes: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing[2],
  },
  pipe: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  nibsText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[3],
  },
  progressBarOuter: {
    width: '80%',
    height: 8,
    backgroundColor: colors.bgLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4,
  },
  nextLevelText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.dustyMauve,
  },
  modalContent: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  classLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  requiredSection: {
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  requiredTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
    marginBottom: spacing[1],
  },
  requiredValue: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text,
  },
  currentNibs: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.dustyMauve,
  },
});
