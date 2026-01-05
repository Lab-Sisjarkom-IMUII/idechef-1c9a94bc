import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@supabase/supabase-js';
import { ChevronLeft, ChefHat, Star, Clock, Flame, Share2, Trash2 } from 'lucide-react';

interface Recipe {
  id: string;
  ingredients: string;
  recipe_title: string;
  recipe_text: string;
  created_at: string;
  is_favorite: boolean;
  personal_notes: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [personalNote, setPersonalNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const translations = {
    id: {
      back: "Kembali",
      userProfile: "Profil Pengguna",
      email: "Email",
      name: "Nama",
      chefLevel: {
        beginner: "Koki Pemula 🥕",
        skilled: "Juru Masak Handal 🔪",
        master: "Master Chef 👨‍🍳"
      },
      recipesCreated: "resep telah dibuat",
      recipeHistory: "Riwayat Resep Anda",
      allRecipes: "Semua Resep",
      favoriteRecipes: "Resep Favorit",
      created: "Dibuat",
      ingredients: "Bahan yang digunakan",
      close: "Tutup",
      personalNotes: "📝 Catatan Pribadi Saya",
      notePlaceholder: "Tulis catatan pribadi Anda tentang resep ini...",
      saveNote: "Simpan Catatan",
      savingNote: "Menyimpan...",
      loading: "Memuat riwayat...",
      noFavorites: "Belum ada resep favorit.",
      noRecipes: "Belum ada resep yang dibuat.",
      viewAllRecipes: "Lihat Semua Resep",
      createFirstRecipe: "Buat Resep Pertama",
      addedToFavorites: "Ditambahkan ke favorit!",
      removedFromFavorites: "Dihapus dari favorit",
      favoriteDescription: "Resep ini telah ditandai sebagai favorit",
      unfavoriteDescription: "Resep ini telah dihapus dari favorit",
      recipeCopied: "Resep berhasil disalin!",
      readyToShare: "Siap untuk dibagikan",
      recipeDeleted: "Resep berhasil dihapus!",
      deletedFrom: "telah dihapus dari riwayat",
      noteSaved: "Catatan berhasil disimpan!",
      noteSavedDescription: "Catatan pribadi Anda telah tersimpan",
      cookingTime: "Estimasi Waktu Memasak",
      calories: "Estimasi.*Kalori"
    },
    en: {
      back: "Back",
      userProfile: "User Profile",
      email: "Email",
      name: "Name",
      chefLevel: {
        beginner: "Beginner Chef 🥕",
        skilled: "Skilled Cook 🔪",
        master: "Master Chef 👨‍🍳"
      },
      recipesCreated: "recipes created",
      recipeHistory: "Your Recipe History",
      allRecipes: "All Recipes",
      favoriteRecipes: "Favorite Recipes",
      created: "Created",
      ingredients: "Ingredients used",
      close: "Close",
      personalNotes: "📝 My Personal Notes",
      notePlaceholder: "Write your personal notes about this recipe...",
      saveNote: "Save Note",
      savingNote: "Saving...",
      loading: "Loading history...",
      noFavorites: "No favorite recipes yet.",
      noRecipes: "No recipes created yet.",
      viewAllRecipes: "View All Recipes",
      createFirstRecipe: "Create First Recipe",
      addedToFavorites: "Added to favorites!",
      removedFromFavorites: "Removed from favorites",
      favoriteDescription: "This recipe has been marked as favorite",
      unfavoriteDescription: "This recipe has been removed from favorites",
      recipeCopied: "Recipe copied successfully!",
      readyToShare: "Ready to share",
      recipeDeleted: "Recipe deleted successfully!",
      deletedFrom: "has been removed from history",
      noteSaved: "Note saved successfully!",
      noteSavedDescription: "Your personal note has been saved",
      cookingTime: "Cooking Time",
      calories: "Calories"
    }
  };

  const t = translations[language];

  const getChefLevel = (recipeCount: number): string => {
    if (recipeCount < 5) return t.chefLevel.beginner;
    if (recipeCount <= 10) return t.chefLevel.skilled;
    return t.chefLevel.master;
  };

  const chefLevel = getChefLevel(recipes.length);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/register');
        return;
      }
      setUser(user);
      await fetchRecipes(user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/register');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRecipes = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: t.loading,
        description: "Error loading recipe history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (recipeId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('recipes')
      .update({ is_favorite: !currentStatus })
      .eq('id', recipeId);

    if (error) {
      console.error('Error updating favorite:', error);
      toast({
        title: "Gagal memperbarui favorit",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    } else {
      setRecipes(recipes.map(r => 
        r.id === recipeId ? { ...r, is_favorite: !currentStatus } : r
      ));
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe({ ...selectedRecipe, is_favorite: !currentStatus });
      }
      toast({
        title: !currentStatus ? t.addedToFavorites : t.removedFromFavorites,
        description: !currentStatus ? t.favoriteDescription : t.unfavoriteDescription,
      });
    }
  };

  const shareRecipe = (recipeToShare: Recipe) => {
    const shareText = `${recipeToShare.recipe_text}\n\n${recipeToShare.personal_notes ? `Catatan Pribadi:\n${recipeToShare.personal_notes}\n\n` : ''}---\nResep dibuat dengan Ide.Chef`;

    try {
      navigator.clipboard.writeText(shareText);
      toast({
        title: t.recipeCopied,
        description: t.readyToShare,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy recipe",
        variant: "destructive",
      });
    }
  };

  const savePersonalNote = async () => {
    if (!selectedRecipe) return;

    setIsSavingNote(true);
    const { error } = await supabase
      .from('recipes')
      .update({ personal_notes: personalNote })
      .eq('id', selectedRecipe.id);

    if (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Gagal menyimpan catatan",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    } else {
      setSelectedRecipe({ ...selectedRecipe, personal_notes: personalNote });
      setRecipes(recipes.map(r => 
        r.id === selectedRecipe.id ? { ...r, personal_notes: personalNote } : r
      ));
      toast({
        title: t.noteSaved,
        description: t.noteSavedDescription,
      });
    }
    setIsSavingNote(false);
  };

  const deleteRecipe = async (recipeId: string) => {
    const recipeToDelete = recipes.find(r => r.id === recipeId);
    if (!recipeToDelete) return;

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Gagal menghapus resep",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    } else {
      setRecipes(recipes.filter(r => r.id !== recipeId));
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
        setPersonalNote("");
      }
      toast({
        title: t.recipeDeleted,
        description: `"${recipeToDelete.recipe_title}" ${t.deletedFrom}`,
      });
    }
  };

  const filteredRecipes = filterFavorites 
    ? recipes.filter(r => r.is_favorite) 
    : recipes;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRecipeText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Check for cooking time and calories
      if (line.match(new RegExp(t.cookingTime, "i"))) {
        return (
          <div key={index} className="flex items-center gap-2 my-4 p-3 bg-secondary/20 rounded-lg">
            <Clock className="w-5 h-5 text-primary" />
            <p className="font-semibold text-foreground mb-0">{line}</p>
          </div>
        );
      }
      
      if (line.match(new RegExp(t.calories, "i"))) {
        return (
          <div key={index} className="flex items-center gap-2 my-4 p-3 bg-secondary/20 rounded-lg">
            <Flame className="w-5 h-5 text-orange-500" />
            <p className="font-semibold text-foreground mb-0">{line}</p>
          </div>
        );
      }

      // Title (H2)
      if (line.match(/^#+\s+(.+)/) || (index === 0 && line.trim())) {
        const title = line.replace(/^#+\s+/, '').trim();
        return (
          <h2 key={index} className="text-2xl font-bold mb-4 text-foreground">
            {title}
          </h2>
        );
      }
      
      // Bullet points
      if (line.match(/^[-*]\s+(.+)/)) {
        const text = line.replace(/^[-*]\s+/, '').trim();
        return (
          <li key={index} className="ml-6 mb-2 list-disc text-foreground">
            {text}
          </li>
        );
      }
      
      // Numbered lists
      if (line.match(/^\d+\.\s+(.+)/)) {
        const text = line.replace(/^\d+\.\s+/, '').trim();
        return (
          <li key={index} className="ml-6 mb-2 list-decimal text-foreground">
            {text}
          </li>
        );
      }
      
      // Section headers (bold text)
      if (line.match(/^[A-Z][^:]*:/)) {
        return (
          <p key={index} className="font-bold mt-4 mb-2 text-foreground">
            {line}
          </p>
        );
      }
      
      // Regular paragraphs
      if (line.trim()) {
        return (
          <p key={index} className="mb-2 text-foreground">
            {line}
          </p>
        );
      }
      
      // Empty lines
      return <br key={index} />;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button onClick={() => navigate('/app')} variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t.back}
          </Button>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ide.Chef
            </h1>
            <span className="text-xs text-muted-foreground font-medium">{chefLevel}</span>
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* User Info Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{t.userProfile}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{t.email}:</span> {user?.email}
                </p>
                {user?.user_metadata?.full_name && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{t.name}:</span> {user.user_metadata.full_name}
                  </p>
                )}
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {chefLevel}
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {recipes.length} {t.recipesCreated}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipe History Section */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              {t.recipeHistory}
            </h2>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button
                onClick={() => setFilterFavorites(false)}
                variant={!filterFavorites ? "default" : "outline"}
                size="sm"
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                {t.allRecipes}
              </Button>
              <Button
                onClick={() => setFilterFavorites(true)}
                variant={filterFavorites ? "default" : "outline"}
                size="sm"
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                <Star className="w-4 h-4 mr-1" />
                {t.favoriteRecipes}
              </Button>
            </div>
          </div>
        </div>

        {selectedRecipe ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl">{selectedRecipe.recipe_title}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => shareRecipe(selectedRecipe)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-accent"
                        title="Bagikan resep"
                      >
                        <Share2 className="w-5 h-5 text-muted-foreground" />
                      </Button>
                      <Button
                        onClick={() => toggleFavorite(selectedRecipe.id, selectedRecipe.is_favorite)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-transparent"
                        title="Tandai sebagai favorit"
                      >
                        <Star 
                          className={`w-6 h-6 ${selectedRecipe.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      </Button>
                      <Button
                        onClick={() => deleteRecipe(selectedRecipe.id)}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/10"
                        title="Hapus resep"
                      >
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.created}: {formatDate(selectedRecipe.created_at)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-semibold">{t.ingredients}:</span> {selectedRecipe.ingredients}
                  </p>
                </div>
                <Button onClick={() => {
                  setSelectedRecipe(null);
                  setPersonalNote("");
                }} variant="outline" size="sm">
                  {t.close}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none mb-8">
                {renderRecipeText(selectedRecipe.recipe_text)}
              </div>
              
              {/* Personal Notes Section */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {t.personalNotes}
                </h3>
                <Textarea
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className="min-h-[120px] mb-4"
                />
                <Button 
                  onClick={savePersonalNote}
                  disabled={isSavingNote}
                  size="sm"
                >
                  {isSavingNote ? t.savingNote : t.saveNote}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p className="text-muted-foreground col-span-full text-center py-8">{t.loading}</p>
            ) : filteredRecipes.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center">
                  <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {filterFavorites ? t.noFavorites : t.noRecipes}
                  </p>
                  <Button onClick={() => filterFavorites ? setFilterFavorites(false) : navigate('/app')} className="mt-4">
                    {filterFavorites ? t.viewAllRecipes : t.createFirstRecipe}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredRecipes.map((recipe) => (
                <Card 
                  key={recipe.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setPersonalNote(recipe.personal_notes || "");
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2 flex-1">{recipe.recipe_title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(recipe.id, recipe.is_favorite);
                          }}
                          variant="ghost"
                          size="sm"
                          className="hover:bg-transparent -mt-1"
                        >
                          <Star 
                            className={`w-5 h-5 ${recipe.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                          />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecipe(recipe.id);
                          }}
                          variant="ghost"
                          size="sm"
                          className="hover:bg-destructive/10 -mt-1 -mr-2"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      <span className="font-semibold">Bahan:</span> {recipe.ingredients}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(recipe.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
