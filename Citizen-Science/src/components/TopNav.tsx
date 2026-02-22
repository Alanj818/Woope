import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
}

const TopNav: React.FC<TopNavProps> = ({ title = '', showBack = false, onBack, rightComponent }) => {
  const insets = useSafeAreaInsets();
  const navigation: any = useNavigation();
  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation && navigation.goBack) navigation.goBack();
  };

  return (
    <LinearGradient
      colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.header, { paddingTop: insets.top + 8, height: insets.top + 56 }]}
    >
      <View style={styles.headerInner}>
        <View style={styles.leftGroup}>
          {showBack ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          ) : null}

          <View style={styles.headingWrapper}>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        </View>
        {rightComponent && <View>{rightComponent}</View>}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    height: 76,
    paddingTop: 16,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 0,
  },
  headerInner: {
    alignItems: 'center',
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    marginRight: 8,
    padding: 6,
  },
  headingWrapper: {
    height: 44,
    justifyContent: 'center'
  },
  titleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 28,
  },
});

export default TopNav;
