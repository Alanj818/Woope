import React, { useState, useContext } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { likePost, unlikePost } from "../api/posts";
import { AuthContext } from "../util/AuthContext";

interface LikeButtonProps {
    postId: number;
    user_id: number;
    initialLikesCount?: number;
    likedPost: boolean;
    onToggle?: (postId: number, liked: boolean, likesCount: number) => void;
}

// Assuming likePost and unlikePost are async functions that return the updated likes count
const LikeButton: React.FC<LikeButtonProps> = ({ postId, user_id, initialLikesCount = 0, likedPost, onToggle }) => {
    const [liked, setLiked] = useState<boolean>(Boolean(likedPost));
    const [likesCount, setLikesCount] = useState<number>(initialLikesCount);

    const { setUserToken } = useContext(AuthContext);

    // keep internal state in sync if parent updates props
    React.useEffect(() => {
        setLiked(Boolean(likedPost));
    }, [likedPost]);

    React.useEffect(() => {
        setLikesCount(initialLikesCount);
    }, [initialLikesCount]);

    const toggleLike = async () => {
        // optimistic update
        const prevLiked = liked;
        const prevCount = likesCount;
        const newLiked = !prevLiked;
        const newCount = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

        setLiked(newLiked);
        setLikesCount(newCount);

        try {
            if (newLiked) {
                await likePost(postId, user_id, setUserToken);
            } else {
                await unlikePost(postId, user_id, setUserToken);
            }
            // notify parent of the change
            if (onToggle) onToggle(postId, newLiked, newCount);
        } catch (error) {
            // rollback on failure
            console.error('Error toggling like:', error);
            setLiked(prevLiked);
            setLikesCount(prevCount);
        }
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 0 }}>
            <Pressable onPress={toggleLike} style={styles.LikeButton}>
                <MaterialCommunityIcons
                    name={liked ? "heart" : "heart-outline"}
                    size={18}
                    color={liked ? "red" : "black"}
                />
            </Pressable>
            <Text style={{ marginLeft: 6, fontSize: 15, color: '#6b7280' }}>{likesCount}</Text>
        </View>
    );
};
const styles = StyleSheet.create({
    LikeButton: {
        marginLeft: 4,
        padding: 4,
    },

});
export default LikeButton;
