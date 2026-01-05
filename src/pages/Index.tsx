import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChefHat, Sparkles, UtensilsCrossed, LogOut, Star, Clock, Flame, Camera, Share2, Globe } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const [ingredients, setIngredients] = useState("");
  const [recipe, setRecipe] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cookingType, setCookingType] = useState<string | null>(null);
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [dietFilters, setDietFilters] = useState({
    vegetarian: false,
    noNuts: false,
    noSpicy: false,
    halal: false,
    lowCalorie: false,
  });
  const [servings, setServings] = useState(2);
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, setLanguage } = useLanguage();

  const translations = {
    id: {
      title: "Ide.Chef – Generator Resep Masakan Cerdas",
      subtitle: "Generator Resep Berbasis AI",
      description: "Temukan inspirasi masakan dalam sekejap! Masukkan bahan yang Anda miliki, dan biarkan AI kami menghasilkan resep lezat yang sempurna untuk Anda.",
      ingredientsPlaceholder: "Masukkan bahan-bahan yang Anda miliki, contoh: ayam, bawang merah, tomat, cabai...",
      cookingTypes: {
        stir: "Tumis 🥘",
        fried: "Goreng 🍗",
        soup: "Berkuah 🍲"
      },
      dietFilters: {
        title: "Filter Tambahan",
        vegetarian: "Vegetarian",
        noNuts: "Tanpa Kacang",
        noSpicy: "Tanpa Pedas",
        halal: "Halal",
        lowCalorie: "Rendah Kalori"
      },
      servings: "Jumlah Porsi/Orang",
      generateButton: "Buatkan Resep! 🍳",
      generatingButton: "Membuat Resep...",
      loadingMessage: "Ide.Chef sedang meracik ide... 🍳",
      profile: "Profil",
      logout: "Logout",
      login: "Login",
      register: "Daftar",
      scanImage: "Scan bahan dari gambar",
      analyzingImage: "Menganalisis gambar..."
    },
    en: {
      title: "Ide.Chef – Smart AI Recipe Generator",
      subtitle: "AI-Powered Recipe Generator",
      description: "Find cooking inspiration in a flash! Enter the ingredients you have, and let our AI generate the perfect delicious recipe for you.",
      ingredientsPlaceholder: "Enter ingredients you have, example: chicken, red onion, tomato, chili...",
      cookingTypes: {
        stir: "Stir-fry 🥘",
        fried: "Fried 🍗",
        soup: "Soup 🍲"
      },
      dietFilters: {
        title: "Additional Filters",
        vegetarian: "Vegetarian",
        noNuts: "Nut-free",
        noSpicy: "Non-spicy",
        halal: "Halal",
        lowCalorie: "Low Calorie"
      },
      servings: "Number of Servings",
      generateButton: "Generate Recipe! 🍳",
      generatingButton: "Generating Recipe...",
      loadingMessage: "Ide.Chef is cooking up ideas... 🍳",
      profile: "Profile",
      logout: "Logout",
      login: "Login",
      register: "Register",
      scanImage: "Scan ingredients from image",
      analyzingImage: "Analyzing image..."
    }
  };

  const t = translations[language];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/register");
      } else {
        setIsLoggedIn(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/register");
      } else {
        setIsLoggedIn(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari akun",
    });
    navigate("/register");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Error",
            description: "Please login to use this feature",
            variant: "destructive",
          });
          setIsAnalyzingImage(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('analyze-ingredients', {
          body: { imageBase64: base64Image },
        });

        if (error) throw error;

        setIngredients(data.ingredients);
        toast({
          title: "Bahan berhasil di-scan!",
          description: "Silakan review dan edit jika diperlukan",
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Error",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const shareRecipe = async () => {
    if (!recipe) return;

    const shareText = `${recipe}\n\n---\nResep dibuat dengan Ide.Chef`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Resep berhasil disalin!",
        description: "Siap untuk dibagikan",
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

  const toggleFavorite = async () => {
    if (!currentRecipeId) return;

    try {
      const newFavoriteStatus = !isFavorite;
      
      const { error } = await supabase
        .from('recipes')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', currentRecipeId);

      if (error) throw error;

      setIsFavorite(newFavoriteStatus);

      toast({
        title: newFavoriteStatus ? "Ditambahkan ke favorit" : "Dihapus dari favorit",
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.trim().length < 3) {
      toast({
        title: "Input tidak valid",
        description: "Mohon masukkan minimal 3 karakter untuk bahan-bahan",
        variant: "destructive",
      });
      return;
    }

    if (!isLoggedIn) {
      toast({
        title: "Belum login",
        description: "Silakan login terlebih dahulu untuk membuat resep",
        variant: "destructive",
      });
      navigate('/register');
      return;
    }

    setIsLoading(true);
    setRecipe("");

    try {
      // Build diet filter text
      const selectedFilters = [];
      if (dietFilters.vegetarian) selectedFilters.push("Vegetarian");
      if (dietFilters.noNuts) selectedFilters.push("Tanpa Kacang");
      if (dietFilters.noSpicy) selectedFilters.push("Tanpa Pedas");
      if (dietFilters.halal) selectedFilters.push("Halal");
      if (dietFilters.lowCalorie) selectedFilters.push("Rendah Kalori");

      const filterText = selectedFilters.length > 0 ? selectedFilters.join(", ") : null;

      const promptText = cookingType 
        ? `${ingredients}. Prioritaskan untuk membuat resep jenis ${cookingType}.`
        : ingredients;

      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-recipe', {
        body: { 
          ingredients: promptText,
          dietFilters: filterText,
          language: language === "id" ? "Bahasa Indonesia" : "English",
          servings: servings
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (functionData?.error) {
        throw new Error(functionData.error);
      }

      const generatedRecipe = functionData?.recipe || 'Tidak ada resep yang dihasilkan';
      setRecipe(generatedRecipe);

      // Extract title from recipe (first line or heading)
      const titleMatch = generatedRecipe.match(/^#*\s*(.+?)(?:\n|$)/);
      const recipeTitle = titleMatch ? titleMatch[1].trim() : 'Resep Tanpa Judul';

      // Save recipe to database
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const { data: savedRecipe, error: saveError } = await supabase
          .from('recipes')
          .insert({
            user_id: user.user.id,
            ingredients: ingredients.trim(),
            recipe_title: recipeTitle,
            recipe_text: generatedRecipe,
            is_favorite: false
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving recipe:', saveError);
          toast({
            title: "Resep berhasil dibuat",
            description: "Namun gagal menyimpan ke riwayat",
            variant: "default",
          });
        } else {
          setCurrentRecipeId(savedRecipe.id);
          setIsFavorite(false);

          // Check for level up
          const { count } = await supabase
            .from('recipes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.user.id);

          const recipeCount = count || 0;

          if (recipeCount === 5) {
            toast({
              title: "🎉 Selamat! Kamu naik level! 🎉",
              description: "Kamu sekarang menjadi Juru Masak Handal 🔪",
              duration: 5000,
            });
          } else if (recipeCount === 11) {
            toast({
              title: "🎊 Luar Biasa! Kamu naik level! 🎊",
              description: "Kamu sekarang menjadi Master Chef 👨‍🍳",
              duration: 5000,
            });
          } else {
            toast({
              title: "Resep berhasil dibuat!",
              description: "Resep telah disimpan ke riwayat Anda",
            });
          }
        }
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      setRecipe("");
      toast({
        title: "Oops! Sepertinya ada sedikit masalah di dapur kami",
        description: "Silakan coba beberapa saat lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-white to-[#F5F5F0] flex flex-col">
      {/* Header Bar */}
      <header className="w-full bg-white/80 backdrop-blur-sm border-b border-border z-20 py-3 px-4 md:px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex gap-2">
            {isLoggedIn ? (
              <Button
                onClick={() => navigate("/profile")}
                variant="outline"
                size="sm"
              >
                {t.profile}
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                size="sm"
              >
                {t.login}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Globe className="w-4 h-4" />
                  {language === "id" ? "🇮🇩 Indonesia" : "🇬🇧 English"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border z-50">
                <DropdownMenuItem onClick={() => setLanguage("id")} className="cursor-pointer">
                  🇮🇩 Indonesia
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className="cursor-pointer">
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isLoggedIn ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="w-4 h-4" />
                {t.logout}
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/register")}
                variant="default"
                size="sm"
              >
                {t.register}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center">
        {/* Content */}
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 border border-primary/20 mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t.subtitle}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 text-center">
              {t.title}
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200 text-center">
              {t.description}
            </p>

            {/* Recipe Generator */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder={t.ingredientsPlaceholder}
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      className="min-h-[100px] bg-card backdrop-blur border-border shadow-md focus:shadow-lg transition-shadow"
                      maxLength={500}
                      disabled={isLoading || isAnalyzingImage}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {ingredients.length}/500 karakter
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzingImage || isLoading}
                      className="h-12 w-12 flex-shrink-0"
                      title={t.scanImage}
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                {isAnalyzingImage && (
                  <p className="text-sm text-muted-foreground animate-pulse">{t.analyzingImage}</p>
                )}
              </div>

              {/* Cooking Type Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => setCookingType(cookingType === "Tumis" ? null : "Tumis")}
                  variant={cookingType === "Tumis" ? "default" : "secondary"}
                  size="sm"
                  disabled={isLoading}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  {t.cookingTypes.stir}
                </Button>
                <Button
                  onClick={() => setCookingType(cookingType === "Goreng" ? null : "Goreng")}
                  variant={cookingType === "Goreng" ? "default" : "secondary"}
                  size="sm"
                  disabled={isLoading}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  {t.cookingTypes.fried}
                </Button>
                <Button
                  onClick={() => setCookingType(cookingType === "Berkuah" ? null : "Berkuah")}
                  variant={cookingType === "Berkuah" ? "default" : "secondary"}
                  size="sm"
                  disabled={isLoading}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  {t.cookingTypes.soup}
                </Button>
              </div>

              {/* Diet Filters */}
              <div className="p-4 rounded-lg bg-card/50 border border-border space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t.dietFilters.title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={dietFilters.vegetarian}
                      onCheckedChange={(checked) => 
                        setDietFilters({...dietFilters, vegetarian: !!checked})
                      }
                      disabled={isLoading}
                    />
                    <span className="text-sm text-foreground">{t.dietFilters.vegetarian}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={dietFilters.noNuts}
                      onCheckedChange={(checked) => 
                        setDietFilters({...dietFilters, noNuts: !!checked})
                      }
                      disabled={isLoading}
                    />
                    <span className="text-sm text-foreground">{t.dietFilters.noNuts}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={dietFilters.noSpicy}
                      onCheckedChange={(checked) => 
                        setDietFilters({...dietFilters, noSpicy: !!checked})
                      }
                      disabled={isLoading}
                    />
                    <span className="text-sm text-foreground">{t.dietFilters.noSpicy}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={dietFilters.halal}
                      onCheckedChange={(checked) => 
                        setDietFilters({...dietFilters, halal: !!checked})
                      }
                      disabled={isLoading}
                    />
                    <span className="text-sm text-foreground">{t.dietFilters.halal}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={dietFilters.lowCalorie}
                      onCheckedChange={(checked) => 
                        setDietFilters({...dietFilters, lowCalorie: !!checked})
                      }
                      disabled={isLoading}
                    />
                    <span className="text-sm text-foreground">{t.dietFilters.lowCalorie}</span>
                  </label>
                </div>
              </div>

              {/* Servings Input */}
              <div className="flex flex-col items-center gap-2">
                <label htmlFor="servings" className="text-sm font-semibold text-foreground">
                  {t.servings}
                </label>
                <input
                  id="servings"
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={isLoading}
                  className="w-24 px-3 py-2 text-center border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  placeholder="2"
                />
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={handleGenerateRecipe}
                  disabled={isLoading}
                  variant="hero" 
                  size="lg" 
                  className="w-full sm:w-auto text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <ChefHat className="w-5 h-5" />
                  {isLoading ? t.generatingButton : t.generateButton}
                </Button>
              </div>

              {isLoading && (
                <div className="mt-6 p-8 rounded-xl bg-card border border-border shadow-lg text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ChefHat className="w-12 h-12 text-primary animate-bounce" />
                    <p className="text-lg font-medium text-foreground">
                      {t.loadingMessage}
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && recipe && (
                <div className="mt-6 p-6 rounded-xl bg-card border border-border shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Resep untuk Anda
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={shareRecipe}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-accent"
                        title="Bagikan resep"
                      >
                        <Share2 className="w-5 h-5 text-muted-foreground" />
                      </Button>
                      {currentRecipeId && (
                        <Button
                          onClick={toggleFavorite}
                          variant="ghost"
                          size="sm"
                          className="hover:bg-transparent"
                          title="Tandai sebagai favorit"
                        >
                          <Star 
                            className={`w-6 h-6 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                          />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    {recipe.split('\n').map((line, index) => {
                      // Check for cooking time and calories
                      if (line.match(/Estimasi Waktu Memasak:/i)) {
                        return (
                          <div key={index} className="flex items-center gap-2 my-4 p-3 bg-secondary/20 rounded-lg">
                            <Clock className="w-5 h-5 text-primary" />
                            <p className="font-semibold text-foreground mb-0">{line}</p>
                          </div>
                        );
                      }
                      
                      if (line.match(/Estimasi.*Kalori:/i)) {
                        return (
                          <div key={index} className="flex items-center gap-2 my-4 p-3 bg-secondary/20 rounded-lg">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <p className="font-semibold text-foreground mb-0">{line}</p>
                          </div>
                        );
                      }

                      // Title (H2)
                      if (line.match(/^#+\s+(.+)/) || (index === 0 && line.trim() && !line.startsWith('-') && !line.startsWith('*') && !line.match(/^\d+\./))) {
                        const title = line.replace(/^#+\s+/, '').trim();
                        return (
                          <h2 key={index} className="text-2xl font-bold mb-4 mt-6 text-foreground">
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
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all shadow-md">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              AI Cerdas
            </h3>
            <p className="text-muted-foreground">
              Teknologi AI terkini yang memahami preferensi dan kebutuhan kuliner Anda
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all shadow-md">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <ChefHat className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              Resep Variatif
            </h3>
            <p className="text-muted-foreground">
              Ribuan variasi resep dari berbagai cuisine untuk setiap kesempatan
            </p>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all shadow-md">
            <div className="w-12 h-12 rounded-lg bg-accent/50 flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              Langkah Mudah
            </h3>
            <p className="text-muted-foreground">
              Instruksi detail yang mudah diikuti, cocok untuk pemula hingga profesional
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
