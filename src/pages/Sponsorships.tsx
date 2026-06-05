import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HandshakeIcon, Plus, Trash2, Edit2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface Sponsor {
  id: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  tier: "platinum" | "gold" | "silver" | "partner";
}

interface SponsorshipsProps {
  isAdmin: boolean;
}

export const Sponsorships = ({ isAdmin }: SponsorshipsProps) => {
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({
    name: "",
    description: "",
    logo: "",
    website: "",
    tier: "partner"
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Sponsor | null>(null);

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading sponsors:', error);
      return;
    }

    if (data) {
      setSponsors(data.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        logo: s.logo || "https://via.placeholder.com/200x100?text=Logo",
        website: s.website || "",
        tier: s.tier as Sponsor["tier"]
      })));
    }
  };

  const addSponsor = async () => {
    if (!newSponsor.name || !newSponsor.description) {
      toast({
        title: "Error",
        description: "Please fill in name and description",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('sponsors')
      .insert([{
        name: newSponsor.name,
        description: newSponsor.description,
        logo: newSponsor.logo || "https://via.placeholder.com/200x100?text=Logo",
        website: newSponsor.website || "",
        tier: newSponsor.tier
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add sponsor: " + error.message,
        variant: "destructive"
      });
      return;
    }

    setNewSponsor({ name: "", description: "", logo: "", website: "", tier: "partner" });
    await loadSponsors();
    toast({
      title: "Success",
      description: "Sponsor added successfully"
    });
  };

  const updateSponsor = async () => {
    if (!editForm) return;

    const { error } = await supabase
      .from('sponsors')
      .update({
        name: editForm.name,
        description: editForm.description,
        logo: editForm.logo,
        website: editForm.website,
        tier: editForm.tier
      })
      .eq('id', editForm.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update sponsor",
        variant: "destructive"
      });
      return;
    }

    setEditForm(null);
    setEditingId(null);
    await loadSponsors();
    toast({
      title: "Success",
      description: "Sponsor updated successfully"
    });
  };

  const deleteSponsor = async (id: string) => {
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete sponsor",
        variant: "destructive"
      });
      return;
    }

    await loadSponsors();
    toast({
      title: "Success",
      description: "Sponsor removed"
    });
  };

  const startEdit = (sponsor: Sponsor) => {
    setEditForm(sponsor);
    setEditingId(sponsor.id);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum": return "text-primary";
      case "gold": return "text-yellow-500";
      case "silver": return "text-gray-400";
      default: return "text-muted-foreground";
    }
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const sortedSponsors = [...sponsors].sort((a, b) => {
    const tierOrder = { platinum: 0, gold: 1, silver: 2, partner: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center py-12 animate-fade-in">
          <HandshakeIcon className="h-16 w-16 mx-auto mb-4 text-primary animate-float" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Our Sponsors & Partners</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Meet the amazing organizations that support GTEC and help make Gorilla Tag Elite COMP possible.
          </p>
        </div>

        {/* Admin Add Sponsor */}
        {isAdmin && (
          <Card className="admin-panel mb-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Add New Sponsor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Sponsor name"
                value={newSponsor.name}
                onChange={(e) => setNewSponsor({...newSponsor, name: e.target.value})}
              />
              <Textarea
                placeholder="Description"
                value={newSponsor.description}
                onChange={(e) => setNewSponsor({...newSponsor, description: e.target.value})}
                rows={3}
              />
              <Input
                placeholder="Logo URL"
                value={newSponsor.logo}
                onChange={(e) => setNewSponsor({...newSponsor, logo: e.target.value})}
              />
              <Input
                placeholder="Website URL"
                value={newSponsor.website}
                onChange={(e) => setNewSponsor({...newSponsor, website: e.target.value})}
              />
              <select
                value={newSponsor.tier}
                onChange={(e) => setNewSponsor({...newSponsor, tier: e.target.value as Sponsor["tier"]})}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
              >
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="partner">Partner</option>
              </select>
              <Button onClick={addSponsor} className="w-full">
                Add Sponsor
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSponsors.map((sponsor, index) => (
            <Card key={sponsor.id} className="team-card animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              {editingId === sponsor.id && editForm ? (
                <CardContent className="p-6 space-y-4">
                  <Input
                    placeholder="Sponsor name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                  <Textarea
                    placeholder="Description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                  />
                  <Input
                    placeholder="Logo URL"
                    value={editForm.logo}
                    onChange={(e) => setEditForm({...editForm, logo: e.target.value})}
                  />
                  <Input
                    placeholder="Website URL"
                    value={editForm.website}
                    onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  />
                  <select
                    value={editForm.tier}
                    onChange={(e) => setEditForm({...editForm, tier: e.target.value as Sponsor["tier"]})}
                    className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                  >
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="partner">Partner</option>
                  </select>
                  <div className="flex space-x-2">
                    <Button onClick={updateSponsor} className="flex-1">Save</Button>
                    <Button variant="outline" onClick={() => { setEditingId(null); setEditForm(null); }} className="flex-1">Cancel</Button>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-sm font-semibold ${getTierColor(sponsor.tier)}`}>
                        {getTierLabel(sponsor.tier)}
                      </span>
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(sponsor)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteSponsor(sponsor.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center mb-4 bg-white/5 rounded-lg p-4">
                      <img src={sponsor.logo} alt={`${sponsor.name} logo`} className="h-24 object-contain" />
                    </div>
                    <CardTitle className="text-center">{sponsor.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center mb-4">
                      {sponsor.description}
                    </p>
                    {sponsor.website && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={sponsor.website} target="_blank" rel="noopener noreferrer">
                          Visit Website
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="team-card mt-12 text-center animate-fade-in">
          <CardContent className="py-12">
            <HandshakeIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-4">Interested in Sponsoring GTEC?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our growing community of sponsors and partners. Help support Gorilla Tag Elite COMP and reach thousands of passionate players.
            </p>
            <Button size="lg" className="glow-primary" asChild>
              <a href="https://discord.gg/hB4V4ywqxj" target="_blank" rel="noopener noreferrer">
                Contact Us on Discord
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};