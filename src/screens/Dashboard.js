import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Paragraph from '../components/Paragraph';
import Button from '../components/Button';

export default function Dashboard({ navigation }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch games data
    fetch('https://cdn.espn.com/core/nfl/schedule?xhr=1&year=2024')
      .then(response => response.json())
      .then(data => {
        // Parse the data to extract game information
        console.log(data)
        const allSchedules = Object.values(data['content']['schedule']);
        
        // Flatten all games
        const flattenedGames = allSchedules.flatMap(schedule => {
          return schedule.games.map(game => ({
            id: game.id,
            name: game.name,
            date: game.date,
            time: game.time,
            venue: game.competitions[0].venue.fullName,
            city: game.competitions[0].venue.address.city,
            state: game.competitions[0].venue.address.state,
            tickets: game.competitions[0].tickets[0],
          }));
        });

        // Sort games by date and time
        const sortedGames = flattenedGames.sort((a, b) => {
          const dateA = new Date(a.date + 'T' + a.time);
          const dateB = new Date(b.date + 'T' + b.time);
          return dateA - dateB;
        });

        setGames(sortedGames);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to load games data');
        setLoading(false);
      });
  }, []);

  const renderGameItem = ({ item }) => (
    <View style={styles.gameItem}>
      <Text style={styles.team}>{item.name}</Text>
      <Text style={styles.time}>{new Date(item.date).toLocaleString()}</Text>
      <Text style={styles.venue}>{item.venue}, {item.city}, {item.state}</Text>
      {item.tickets && (
        <View>
          <Text style={styles.tickets}>Tickets: {item.tickets.summary}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(item.tickets.links[0].href)}>
            <Text style={styles.link}>Buy Tickets</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Background>
      <Logo />
      <Header>This Week's Games</Header>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.error}>Error: {error}</Text>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={(item, index) => item.id || index.toString()}
        />
      )}
      <Button
        mode="outlined"
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'StartScreen' }],
          })
        }
      >
        Logout
      </Button>
    </Background>
  );
}

const styles = StyleSheet.create({
  gameItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  team: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  venue: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  tickets: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    fontSize: 14,
    color: 'blue',
    textDecorationLine: 'underline',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});

