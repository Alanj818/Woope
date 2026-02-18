import React, {useState, useEffect} from "react";
import { View, StyleSheet, Text, Image, Dimensions, FlatList, TouchableOpacity, Modal } from "react-native";
import {getResourceInfo } from "../api/resources";
import { Resource } from "../api/types";
import { MaterialIcons } from '@expo/vector-icons';
import UpdateResourceModal from "./UpdateResourceModal";
import DeleteResource from "./DeleteResources";

interface ResourceProps{
    org_id: number;
    resource_id: number;
}

//Component to display event information 
const ResourcesCard:React.FC<ResourceProps> = ({resource_id, org_id}) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteVisible, setIsDeleteVisible] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [data, setData] = useState<Resource[]>([]);
        const fetchInfo = async () => {
            try {
                const resource = await getResourceInfo(resource_id);
                setData(resource);
            } catch (error) {
                console.log(error);
            }
        }
        useEffect(() => {
            fetchInfo();
        },[])
    return(
        <View>
            <FlatList 
            data={data}
            keyExtractor={(item) => String(item.resource_id)}
            scrollEnabled= {false}
            renderItem={({item}) => (
                <View style={styles.cardContainer}>
                    <View style ={styles.headerContainer}>
                        <View style={styles.titleWrapper}>
                            <Text style={styles.title}>{item.name}</Text>
                        </View>
                        <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuVisible(!isMenuVisible)}>
                            <MaterialIcons name="more-vert" size={24} color="#0084D1" />
                        </TouchableOpacity>
                    </View>
                    {/* Dropdown Menu */}
                    {isMenuVisible && (
                        <View style={styles.dropdownMenu}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => {
                                setIsModalVisible(true);
                                setIsMenuVisible(false);
                            }}>
                                <MaterialIcons name="edit" size={18} color="#0084D1" />
                                <Text style={styles.menuItemText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => {
                                setIsDeleteVisible(true);
                                setIsMenuVisible(false);
                            }}>
                                <MaterialIcons name="delete" size={18} color="#e74c3c" />
                                <Text style={[styles.menuItemText, {color: '#e74c3c'}]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* Short Tagline */}
                    <View>
                        <Text style={styles.tagline}>{item.tagline}</Text>
                    </View>
                    {/* Full Description */}
                    <View>
                        <Text style={styles.description}>{item.text_description}</Text>
                    </View>
                    {/*Optional Banner Image */}
                    <View>
                        { item.image_path && <Image style={styles.imageStyle} source={{uri: process.env.EXPO_PUBLIC_API_URL + '/uploads/' + item.image_path}}/>}
                    </View>
                    <UpdateResourceModal isVisible = {isModalVisible} resource_id = {resource_id} onClose={() => {
                        setIsModalVisible(false);
                        fetchInfo();
                    }} />
                    <DeleteResource isVisible = {isDeleteVisible} resource_id={resource_id} org_id={org_id} onClose={() => {
                            setIsDeleteVisible(false);
                    }} />
                </View>
            )}/>
        </View>
    );
};
const deviceWidth = Math.round(Dimensions.get('window').width);
const styles = StyleSheet.create({
    menuButton: {
        padding: 8,
        marginRight: -8,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 40,
        right: 0,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
        zIndex: 20,
        minWidth: 140,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    menuItemText: {
        fontSize: 14,
        color: '#0084D1',
        fontWeight: '500',
    },
    editContainer: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    actionButton: {
        padding: 8,
    },
    cardContainer: { 
        width: deviceWidth,
        backgroundColor: 'white',
        margin: 0,
        marginBottom: 8,
        borderRadius: 0,
        padding: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    headerContainer:{
        flexDirection:'row',
        gap: 12,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: 10,
    },
    titleWrapper: {
        flex: 1,
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
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    tagline:{
        fontSize: 14,
        fontWeight: '600',
    },
    description:{
        fontSize: 10,
        fontWeight: '300',
    },
    category:{
        fontSize:14,
        fontWeight: '200',
    },
    follow:{
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        width: 70,
        padding:5,
        borderRadius: 10,
        shadowOffset: {
            width: 5,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 9,

    },
    buttonContainer:{
        flexDirection:'row',
        justifyContent: 'space-evenly',
        gap: 5,
        padding: 10,
    },
    eventButton:{
       
        padding:10,
        borderRadius:10,
        backgroundColor: 'white',
        shadowOffset: {
            width: 5,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 9,
    },
    postButton:{
        
        padding:10,
        borderRadius:10,
        backgroundColor:'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 5,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 9,
        
    }
});

export default ResourcesCard;