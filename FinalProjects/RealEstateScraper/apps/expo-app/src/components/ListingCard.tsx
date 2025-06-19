import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Listing {
  'Tiêu đề'?: string;
  'Địa chỉ'?: string;
  'Loại hình'?: string;
  'Mức giá'?: string;
  'Diện tích'?: string;
  'Link'?: string;
}

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  return (
    <View style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, margin: 5, borderRadius: 5 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{listing['Tiêu đề'] || 'No Title'}</Text>
      <Text><Text style={{ fontWeight: 'bold' }}>Địa chỉ:</Text> {listing['Địa chỉ'] || 'N/A'}</Text>
      <Text><Text style={{ fontWeight: 'bold' }}>Loại hình:</Text> {listing['Loại hình'] || 'N/A'}</Text>
      <Text><Text style={{ fontWeight: 'bold' }}>Mức giá:</Text> {listing['Mức giá'] || 'N/A'}</Text>
      <Text><Text style={{ fontWeight: 'bold' }}>Diện tích:</Text> {listing['Diện tích'] || 'N/A'}</Text>
      <TouchableOpacity onPress={() => console.log('View Details:', listing['Link'])}>
        <Text style={{ color: 'blue' }}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ListingCard;