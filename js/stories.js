"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

//checks if current story is a favorite, formats string correctly
function favoriteSpan(id) {
  for (let i = 0; i < currentUser.favorites.length; i++) {
     if (currentUser.favorites[i].storyId === id) {
      return `<span class="star">
      <i class="fas fa-star" style="color: #3f9749;"></i>
      </span>`
     }
  }
  return `<span class="star">
  <i class="far fa-star" style="color: #3f9749;"></i>
  </span>`
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        ${currentUser ? favoriteSpan(story.storyId): ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <div class="story-author">by ${story.author}</div>
        <div class="story-user">posted by ${story.username}</div>
        ${isLoggedIn() ? makeDeleteBtn(): ""}
      </li>
    `);
}

function makeDeleteBtn() {
  return `<span class="trash-can">
  <i class="fas fa-trash-alt"></i>
  </span>`
}
function isLoggedIn() {
  if (currentUser){
    return true
  } else {return false}
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

//put favorites on page for current user.
$navFavorites.on('click', putFavoritesOnPage)

function putFavoritesOnPage() {
  console.log('putFavoritesonPage running')
  $allStoriesList.empty();
  if(currentUser.favorites.length === 0) {
    $allStoriesList.append("<h5>No favorites added!</h5>");
  }
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
}

$navMyStories.on('click', putMyStoriesOnPage)

function putMyStoriesOnPage() {
  console.log('putMyStoriesOnPage running')
  $allStoriesList.empty();
  if(currentUser.ownStories.length === 0) {
    $allStoriesList.append("<h5>You don't have any stories. Try submiting one!</h5>");
  }
  for (let story of currentUser.ownStories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
}

$storyForm.on('submit', SubmitStory)

function SubmitStory(evt) {
  evt.preventDefault();
  const author = $('#author-input').val()
  const title = $('#title-input').val()
  const url = $('#url-input').val()
  storyList.addStory(currentUser, {author, title, url})
  putStoriesOnPage();
  $storyForm.trigger('reset');
  $storyForm.hide();
}

async function updateFavorites(evt) {
  const $target = $(evt.target)
  $target.toggleClass('fas far');
  const id = $target.closest('li').attr('id');
  const story = storyList.stories.find(s => s.storyId === id)
  if (currentUser.isAFavorite(story)) {
    await currentUser.deleteFavorite(story);
  } else {
    await currentUser.addNewFavorite(story);
  }
  console.log(currentUser.favorites)
}

$allStoriesList.on('click', '.fa-star', updateFavorites)

async function deleteStory(evt) {
  const $target = $(evt.target)
  const id = $target.closest('li').attr('id');
  const story = storyList.stories.find(s => s.storyId === id)
  const updatedStoryList = storyList.stories.filter(s => {
    return s.storyId !== story.storyId;
  })
  storyList.stories = updatedStoryList;
  
  currentUser.deleteFavorite(story)
  currentUser.deleteOwnStory(story)
  $target.closest('li').remove();
  await axios.delete(`https://hack-or-snooze-v3.herokuapp.com/stories/${story.storyId}`,
    {data: {token: currentUser.loginToken}})
}

$allStoriesList.on('click', '.trash-can', deleteStory)