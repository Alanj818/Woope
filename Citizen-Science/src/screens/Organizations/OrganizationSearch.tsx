/* 
    This screen will display ALL organizations in a directory
 */
import React, {useEffect, useState} from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { getAllOrganizations } from '../../api/organizations';
import { Organization } from '../../api/types';
import { useNavigation } from '@react-navigation/native';
import TopNav from '../../components/TopNav';

const OrganizationSearch = () => {
    const navigation = useNavigation<any>();
    // Fetching all organizations
    const [data,setData] = useState<Organization[]>([]);
    useEffect(() => {
		fetchOrganizations();
	},[]);
    const fetchOrganizations = async () => {
        try {
            const organizationList = await getAllOrganizations();
            setData(organizationList);
        } catch (error) {
            console.log('Failed to retrieve organizations', error);
        }
    };
    if (data[0] !== undefined){
        return(
            <View style={styles.container}>
                <TopNav title="All Organizations" showBack={true} onBack={() => navigation.goBack()} />
                {/*using a flatlist to display organizations, using the org_id as key*/}
                <FlatList
                data={data}
                numColumns={1}
                contentContainerStyle={styles.listContent}
                keyExtractor={item => String(item.org_id)}
                renderItem={({item}) => 
                    (
                    <TouchableOpacity style={styles.orgCard} onPress={() => navigation.navigate("OrganizationProfile",{
                        org_id: item.org_id,
                        name: item.name
                        })}>
                        <Text style={styles.orgName}>{item.name}</Text>
                        {item.tagline && <Text style={styles.orgTagline}>{item.tagline}</Text>}
                    </TouchableOpacity>
                    )}/>
            </View>
        );
    }
    else{
        return(
            <View style={styles.container}>
                <TopNav title="All Organizations" showBack={true} onBack={() => navigation.goBack()} />
                <View style={styles.errorContainer}>
                    <Text style={styles.error}>No organizations exist</Text>
                </View>
            </View>
        );
    }
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    error: {
        fontSize: 16,
        color: '#999',
    },
    orgCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    orgName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    orgTagline: {
        fontSize: 14,
        color: '#666',
    },
    
});

export default OrganizationSearch;