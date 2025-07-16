import { API_URL } from '../api';
import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text, List, Divider } from 'react-native-paper';

export const WrongWordsScreen = () => {
  const [wrongWords, setWrongWords] = useState([]);

  useEffect(() => {
    const fetchWrongWords = async () => {
      try {
        const response = await fetch(`${API_URL}/wrong-words`);
        const data = await response.json();
        setWrongWords(data);
      } catch (error) {
        console.error('Error fetching wrong words:', error);
      }
    };

    fetchWrongWords();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={wrongWords}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }: any) => (
          <>
            <List.Item
              title={item.text}
              description={item.meaning}
              left={props => <List.Icon {...props} icon="alert-circle" />}
            />
            <Divider />
          </>
        )}
      />
    </View>
  );
};
