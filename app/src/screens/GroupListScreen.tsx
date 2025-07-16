import { API_URL } from '../api';
import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, List, Divider } from 'react-native-paper';

export const GroupListScreen = ({ navigation }: any) => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/groups`);
        const data = await response.json();
        setGroups(data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchGroups();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }: any) => (
          <TouchableOpacity onPress={() => navigation.navigate('Flashcards', { groupId: item.id, groupName: item.name })}>
            <List.Item
              title={item.name}
              description={`${item._count.words} words`}
              left={props => <List.Icon {...props} icon="folder" />}
            />
            <Divider />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});
