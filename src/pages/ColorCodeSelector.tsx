import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

interface ColorCodeSelectorProps {
  isAdmin: boolean;
}

export const ColorCodeSelector = ({ isAdmin }: ColorCodeSelectorProps) => {
  const [boxSize, setBoxSize] = useState([200]);
  const [red, setRed] = useState([0]);
  const [green, setGreen] = useState([0]);
  const [blue, setBlue] = useState([0]);

  const resetToDefault = () => {
    setBoxSize([200]);
    setRed([0]);
    setGreen([0]);
    setBlue([0]);
  };

  const rgbColor = `rgb(${red[0]}, ${green[0]}, ${blue[0]})`;

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="hero-text">Color Code Selector</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            A tool for selecting and visualizing colors using RGB values. Adjust the sliders to create your perfect color combination.
          </p>
        </div>

        <Card className="team-card">
          <CardContent className="p-8 space-y-8">
            {/* Color Preview Box */}
            <div className="flex justify-center">
              <div 
                className="border-2 border-muted rounded-lg transition-all duration-200"
                style={{ 
                  width: `${boxSize[0]}px`, 
                  height: `${boxSize[0]}px`,
                  backgroundColor: rgbColor 
                }}
              />
            </div>

            {/* Box Size Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Box Size (px)</label>
                <span className="text-sm text-muted-foreground">{boxSize[0]}</span>
              </div>
              <Slider
                value={boxSize}
                onValueChange={setBoxSize}
                max={400}
                min={50}
                step={10}
                className="w-full"
              />
            </div>

            {/* Default Button */}
            <div className="flex justify-center">
              <Button onClick={resetToDefault} variant="outline">
                Default
              </Button>
            </div>

            {/* RGB Sliders */}
            <div className="space-y-6">
              {/* Red Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-red-500">R</label>
                  <div className="flex items-center space-x-2 text-sm">
                    <span>{red[0]}</span>
                    <span className="text-muted-foreground">|</span>
                    <span>{red[0]}</span>
                  </div>
                </div>
                <Slider
                  value={red}
                  onValueChange={setRed}
                  max={255}
                  min={0}
                  step={5}
                  className="w-full [&_.range]:bg-red-500"
                />
              </div>

              {/* Green Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-green-500">G</label>
                  <div className="flex items-center space-x-2 text-sm">
                    <span>{green[0]}</span>
                    <span className="text-muted-foreground">|</span>
                    <span>{green[0]}</span>
                  </div>
                </div>
                <Slider
                  value={green}
                  onValueChange={setGreen}
                  max={255}
                  min={0}
                  step={5}
                  className="w-full [&_.range]:bg-green-500"
                />
              </div>

              {/* Blue Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-blue-500">B</label>
                  <div className="flex items-center space-x-2 text-sm">
                    <span>{blue[0]}</span>
                    <span className="text-muted-foreground">|</span>
                    <span>{blue[0]}</span>
                  </div>
                </div>
                <Slider
                  value={blue}
                  onValueChange={setBlue}
                  max={255}
                  min={0}
                  step={5}
                  className="w-full [&_.range]:bg-blue-500"
                />
              </div>
            </div>

            {/* Color Information */}
            <div className="bg-muted/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Current Color:</p>
              <p className="font-mono text-sm">{rgbColor}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};