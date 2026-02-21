/*

    !! This screen is the main page for the resources tab
    It also features a carousel of featured organizations which when clicked lead directly to their profiles

*/
import React, {useState} from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getResources } from '../../api/resources';
import { getFeaturedOrganizations } from '../../api/organizations';
import { Resource, Organization } from '../../api/types';
import ResourcesCard from '../../components/ResourceCard';
import FeaturedOrganizationCard from '../../components/FeaturedOrganizationCard';
import TopNav from '../../components/TopNav';

export const ResourceHome = () => {
    const navigation = useNavigation<any>();
    const [resources, setResources] = useState<Resource[]>([]);
    const [featuredOrgs, setFeaturedOrgs] = useState<Organization[]>([]);
    
    useFocusEffect(
        React.useCallback(() => {
            fetchResources();
            fetchFeaturedOrganizations();
        }, [])  
    );
    
    const fetchResources = async () => {
        try {
            const resourceList = await getResources();
            setResources(resourceList);
        } catch (error) {
            console.log('Failed to retrieve resources', error);
        }
    };
    
    const fetchFeaturedOrganizations = async () => {
        try {
            const orgList = await getFeaturedOrganizations();
            setFeaturedOrgs(orgList);
        } catch (error) {
            console.log('Failed to retrieve featured organizations', error);
        }
    };
    

    
    return (
        <View style={styles.container}>
            <TopNav title="Resources" />
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* View All Organizations Button */}
                <LinearGradient
                    colors={['#0088ca', '#0092b8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewAllButton}
                >
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('OrganizationSearch')}
                        activeOpacity={0.7}
                        style={styles.viewAllButtonTouchable}
                    >
                        <Text style={styles.viewAllButtonText}>View All Organizations</Text>
                    </TouchableOpacity>
                </LinearGradient>
                
                {/* Featured Organizations Section */}
                {featuredOrgs.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Featured Groups</Text>
                        <FlatList
                            data={featuredOrgs}
                            numColumns={1}
                            horizontal={true}
                            scrollEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => String(item.org_id)}
                            contentContainerStyle={styles.carouselContent}
                            renderItem={({item})=>(
                                <FeaturedOrganizationCard org_id={item.org_id} name={item.name} tagline={item.tagline} text_description={item.text_description} image_path={item.image_path}/>
                            )}
                        />
                    </View>
                )}
                
                {/* Resources List */}
                <View style={styles.resourcesSection}>
                    <Text style={styles.sectionTitle}>Resources</Text>
                    {resources.length > 0 ? (
                        resources.map((resource) => (
                            <ResourcesCard 
                                key={resource.resource_id}
                                resource_id={resource.resource_id}
                                org_id={resource.org_id}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No resources found</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        backgroundColor: '#f5f5f5',
    },
    viewAllButton: {
        borderRadius: 14,
        marginHorizontal: 14,
        marginBottom: 14,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        overflow: 'hidden',
    },
    viewAllButtonTouchable: {
        paddingVertical: 16,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewAllButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
    },
    carouselContent: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },

    resourcesSection: {
        paddingHorizontal: 0,
        paddingBottom: 24,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
export default ResourceHome;