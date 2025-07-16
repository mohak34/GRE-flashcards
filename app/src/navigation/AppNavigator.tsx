import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GroupListScreen } from '../screens/GroupListScreen';
import { FlashcardScreen } from '../screens/FlashcardScreen';
import { WrongWordsScreen } from '../screens/WrongWordsScreen';
import { theme } from '../theme';
import { Provider as PaperProvider, Appbar, Menu } from 'react-native-paper';
import { useState } from 'react';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const [visible, setVisible] = useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={{ ...theme, colors: { ...theme.colors, background: '#121212' } }}>
        <Stack.Navigator
          initialRouteName="Groups"
          screenOptions={{
            header: ({ navigation, back, route }) => (
              <Appbar.Header>
                {back ? <Appbar.BackAction onPress={navigation.goBack} /> : null}
                <Appbar.Content title={route.name} />
                <Menu
                  visible={visible}
                  onDismiss={closeMenu}
                  anchor={<Appbar.Action icon="menu" color="white" onPress={openMenu} />}
                >
                  <Menu.Item onPress={() => { navigation.navigate('Groups'); closeMenu(); }} title="Groups" />
                  <Menu.Item onPress={() => { navigation.navigate('Wrong Words'); closeMenu(); }} title="Wrong Words" />
                </Menu>
              </Appbar.Header>
            ),
          }}
        >
          <Stack.Screen name="Groups" component={GroupListScreen} />
          <Stack.Screen name="Flashcards" component={FlashcardScreen} />
          <Stack.Screen name="Wrong Words" component={WrongWordsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};
