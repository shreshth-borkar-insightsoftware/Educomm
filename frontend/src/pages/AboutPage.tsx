import PageHeader from "@/components/PageHeader";
import { Monitor, Package, Wrench, Search, ShoppingCart, TrendingUp } from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: <Monitor className="w-8 h-8 text-gray-400 mb-3" />,
      title: "Digital Courses",
      description: "Expert-crafted courses in Arduino, Raspberry Pi, IoT, robotics, and more. Each course includes video lessons, documentation, and step-by-step project guides."
    },
    {
      icon: <Package className="w-8 h-8 text-gray-400 mb-3" />,
      title: "Hardware Kits",
      description: "Curated kits containing all the components, sensors, microcontrollers, and tools you need to complete your course projects. No hunting for parts separately."
    },
    {
      icon: <Wrench className="w-8 h-8 text-gray-400 mb-3" />,
      title: "Learn by Building",
      description: "Every course is paired with a hands-on project. Complete modules, build real circuits, write real code, and see your projects come to life."
    }
  ];

  const steps = [
    {
      number: "1",
      icon: <Search className="w-6 h-6" />,
      title: "Browse Courses",
      description: "Explore our catalog of courses across electronics, programming, and robotics"
    },
    {
      number: "2",
      icon: <ShoppingCart className="w-6 h-6" />,
      title: "Get Your Kit",
      description: "Order the hardware kit that pairs with your chosen course"
    },
    {
      number: "3",
      icon: <Wrench className="w-6 h-6" />,
      title: "Learn & Build",
      description: "Follow along with video modules and build real projects hands-on"
    },
    {
      number: "4",
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Track Progress",
      description: "Mark modules complete, track your progress, and earn completion status"
    }
  ];

  const stats = [
    { label: "Courses", value: "50+" },
    { label: "Hardware Kits", value: "30+" },
    { label: "Students", value: "1000+" },
    { label: "Projects", value: "200+" }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <PageHeader title="About Educomm" />
        
        <div className="mb-12">
          <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
            Educomm is an e-learning platform that bridges the gap between theoretical knowledge and hands-on learning. 
            We offer curated digital courses in electronics, programming, and robotics paired with physical hardware kits 
            so you can learn by building real projects.
          </p>
        </div>

        {/* Our Mission Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">Our Mission</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 md:p-8">
            <p className="text-gray-300 text-lg leading-relaxed">
              We believe the best way to learn technology is by doing. Our mission is to make quality STEM education 
              accessible to everyone by combining expert-designed courses with the physical tools you need to build, 
              experiment, and create. No more watching tutorials without being able to follow along — with Educomm, 
              everything you need arrives at your doorstep.
            </p>
          </div>
        </section>

        {/* What We Offer Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors"
              >
                {feature.icon}
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white font-bold">
                    {step.number}
                  </div>
                  <div className="text-gray-400">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Numbers Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">Our Numbers</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-black text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
          <p className="text-gray-300 text-lg mb-4">
            Have questions? We'd love to hear from you.
          </p>
          <a 
            href="#" 
            className="inline-block bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
          >
            Contact Us
          </a>
        </section>
      </div>
    </div>
  );
}
