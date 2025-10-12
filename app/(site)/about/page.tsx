import ContentOverlay from '@/components/layout/ContentOverlay';

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-20">
      <ContentOverlay>
        <h1 className="text-3xl font-bold mb-6">About Me</h1>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          I'm a technical artist and creative developer with experience in
          real-time 3D graphics, WebGL, and interactive installations.  
          I enjoy building immersive digital experiences that blend art and
          technology.
        </p>
      </ContentOverlay>
    </div>
  );
}
  