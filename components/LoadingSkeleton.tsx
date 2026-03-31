import { Animated, StyleSheet, View } from "react-native";
import { useEffect, useRef } from "react";

import { colors } from "@/constants/theme";

export function LoadingSkeleton() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  return (
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={styles.title} />
      <View style={styles.meta} />
      <View style={styles.metaSmall} />
      <View style={styles.description} />
      <View style={styles.descriptionShort} />
      <View style={styles.button} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
    padding: 18
  },
  title: {
    backgroundColor: colors.skeleton,
    borderRadius: 999,
    height: 20,
    width: "68%"
  },
  meta: {
    backgroundColor: colors.skeleton,
    borderRadius: 999,
    height: 14,
    width: "54%"
  },
  metaSmall: {
    backgroundColor: colors.skeleton,
    borderRadius: 999,
    height: 14,
    width: "40%"
  },
  description: {
    backgroundColor: colors.skeleton,
    borderRadius: 999,
    height: 12,
    width: "100%"
  },
  descriptionShort: {
    backgroundColor: colors.skeleton,
    borderRadius: 999,
    height: 12,
    width: "83%"
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: colors.skeleton,
    borderRadius: 999,
    height: 42,
    marginTop: 4,
    width: 136
  }
});
