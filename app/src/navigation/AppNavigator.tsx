import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GroupListScreen } from '../screens/GroupListScreen';
import { FlashcardScreen } from '../screens/FlashcardScreen';
import { WrongWordsScreen } from '../screens/WrongWordsScreen';
import { theme } from '../theme';
import { Provider as PaperProvider, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Groups') {
            iconName = focused ? 'view-list' : 'view-list-outline';
          } else if (route.name === 'Wrong Words') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          }
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F8EDE3',
        tabBarInactiveTintColor: '#9DB2BF',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 1,
          borderTopColor: '#9DB2BF',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Groups" component={GroupListScreen} />
      <Tab.Screen name="Wrong Words" component={WrongWordsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={{ ...theme, colors: { ...theme.colors, background: '#121212' } }}>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            header: ({ navigation, back, route, options }) => (
              <Appbar.Header>
                {back ? <Appbar.BackAction onPress={navigation.goBack} /> : null}
                <Appbar.Content title={options.title || (route.name === 'Main' ? 'Flashcards' : route.name)} />
                {options.headerRight && options.headerRight({})}
              </Appbar.Header>
            ),
          }}
        >
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Flashcards" component={FlashcardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};
