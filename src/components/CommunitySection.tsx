import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle, User, Send, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  avatar: string;
}

const mockReviews: Review[] = [
  {
    id: "1",
    name: "Wanjiku M.",
    rating: 5,
    comment: "Safe Bazaar saved me from a fake iPhone scam on Facebook Marketplace. The AI detected suspicious pricing patterns immediately!",
    date: "2 days ago",
    likes: 24,
    avatar: "WM"
  },
  {
    id: "2",
    name: "Peter O.",
    rating: 5,
    comment: "As a seller on Jumia, the Premium Seller tools helped me build trust with my customers. My sales increased by 40%!",
    date: "1 week ago",
    likes: 18,
    avatar: "PO"
  },
  {
    id: "3",
    name: "Grace K.",
    rating: 4,
    comment: "Very helpful for checking vendors before buying. The scan history feature is particularly useful for tracking sellers over time.",
    date: "2 weeks ago",
    likes: 12,
    avatar: "GK"
  },
  {
    id: "4",
    name: "James N.",
    rating: 5,
    comment: "Nimependa sana! The Swahili support makes it easy for everyone to use. Asante Safe Bazaar!",
    date: "3 weeks ago",
    likes: 31,
    avatar: "JN"
  }
];

const CommunitySection = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  const handleSubmitReview = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to leave a review",
        variant: "destructive"
      });
      return;
    }
    if (!newComment.trim() || userRating === 0) {
      toast({
        title: "Missing information",
        description: "Please add a rating and comment",
        variant: "destructive"
      });
      return;
    }

    const newReview: Review = {
      id: Date.now().toString(),
      name: user.email?.split("@")[0] || "User",
      rating: userRating,
      comment: newComment,
      date: "Just now",
      likes: 0,
      avatar: user.email?.substring(0, 2).toUpperCase() || "U"
    };

    setReviews([newReview, ...reviews]);
    setNewComment("");
    setUserRating(0);
    toast({
      title: "Review submitted!",
      description: "Thank you for your feedback"
    });
  };

  const handleLike = (reviewId: string) => {
    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, likes: r.likes + 1 } : r
    ));
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Community Reviews</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${star <= Math.round(averageRating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length} reviews)</span>
          </div>
          <p className="text-muted-foreground">See what Kenyan shoppers are saying about Safe Bazaar AI</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Leave a Review */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-fit sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Leave a Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setUserRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoveredStar || userRating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Share your experience with Safe Bazaar AI..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSubmitReview} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {review.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(review.id)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {review.likes}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
