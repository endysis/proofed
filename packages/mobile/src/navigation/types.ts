import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Tab Navigator
export type TabParamList = {
  Home: undefined;
  Pantry: undefined;
  Bakes: undefined;
  Starred: undefined;
};

// Root Stack Navigator
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  ItemDetail: { itemId: string; recipeId?: string; scale?: number; variantId?: string };
  AttemptDetail: { attemptId: string };
  PlanScreen: { attemptId: string };
  BakeScreen: { attemptId: string };
  EvaluateScreen: { attemptId: string };
  NewAttempt: undefined;
  ProofedItemDetail: { proofedItemId: string };
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

// Declare global for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
