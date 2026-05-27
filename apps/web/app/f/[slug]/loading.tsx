import LoadingScreen from '~/components/shared/LoadingScreen';

export default function PublicFormPageLoading() {
  return <LoadingScreen variant="fullscreen" message="Fetching form..." />;
}
