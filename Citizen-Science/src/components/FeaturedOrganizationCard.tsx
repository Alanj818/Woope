import React from "react";
import { View, StyleSheet, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
interface FeaturedOrganizationProps {
    org_id: number;
    name: string;
    tagline: string;
    text_description: string;
    image_path: string;
}
//Component to display organization information on their resource page
const FeaturedOrganizationCard: React.FC<FeaturedOrganizationProps> = ({org_id, name, tagline, text_description, image_path}) => {
    const navigation = useNavigation<any>();
    return(
    // Container
    <View style={styles.cardContainer}>
            {/*Organization Name, Category, Follow Button */}
            <View style ={styles.headerContainer}>
                <View>
                    <Text style={styles.title}>{name}</Text>
                    <Text style={styles.category}></Text>
                </View>
            </View>
            {/*Organization Banner Image */}
            <View>
                {image_path && <Image style={styles.imageStyle} source={{uri: process.env.EXPO_PUBLIC_API_URL + '/uploads/' + image_path}}/> }
            </View>
            {/* Short Tagline */}
            <View>
                <Text style={styles.tagline}>{tagline}</Text>
            </View>
            {/* Full Description */}
            <View>
                <Text style={styles.description}>{text_description}</Text>
            </View>
            {/* Container for Events and Posts Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.postButton} onPress={() => navigation.navigate("OrganizationProfile", {
                    name: name,
                    org_id: org_id,
                })}>
                    <Text style={styles.postButtonText}>Visit Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
const deviceWidth = Math.round(Dimensions.get('window').width);
const styles = StyleSheet.create({
    cardContainer: { 
        width: deviceWidth - 20,
        backgroundColor: '#FFFFFF',
        margin: 10,
        borderRadius: 14,
        padding: 14,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#E6F0FA'
    },
    headerContainer:{
        flexDirection:'row',
        justifyContent: 'space-between',
    },
    imageStyle: {
        height: 150,
        width: deviceWidth - 50,
        opacity:.9,
        alignContent: 'center',
        alignSelf: 'center',
    },
    title:{
    fontSize: 20,
    fontWeight: '700',
    color: '#0F3C63',
    },
    tagline:{
    fontSize: 14,
    fontWeight: '600',
    color: '#436B8A',
    },
    description:{
    fontSize: 12,
    fontWeight: '300',
    color: '#385066',
    },
    category:{
        fontSize:14,
        fontWeight: '200',
    },
    buttonContainer:{
        flexDirection:'row',
        justifyContent: 'space-evenly',
        gap: 5,
        padding: 10,
    },
    postButton:{
        paddingVertical:10,
        paddingHorizontal:16,
        borderRadius:10,
        backgroundColor:'#2F80ED',
        shadowColor: '#2F80ED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontWeight: '600'
    },
    // postBox and inner styles removed in favor of cardContainer
    

});

export default FeaturedOrganizationCard;